-- Groups, import, live monitor, new scoring, locked game 3 answers. Run after schema.sql.
alter table game.roster add column if not exists group_no int;
alter table game.roster add column if not exists store_code text;
alter table game.g3_ans add column if not exists choice text;
alter table game.g3_ans add column if not exists at timestamptz default now();
alter table game.g2_sub add column if not exists at timestamptz default now();
create table if not exists game.groups(no int primary key, nick text not null, en text, ac_key text);
create table if not exists game.store_groups(code text primary key, no int not null);
create table if not exists game.board_cache(id int primary key default 1 check (id = 1), rev bigint not null default -1, board jsonb);
insert into game.board_cache(id) values (1) on conflict do nothing;
update game.state set settings = (settings - 'pairPoints') || '{"fullPoints":100,"halfPoints":50}'::jsonb where id = 1 and not settings ? 'fullPoints';
alter table game.state alter column settings set default '{"fullPoints":100,"halfPoints":50,"bonusStart":15,"signCount":4,"signPoints":[100,75,50,25],"wrongPenalty":0}';

create or replace function game.g2_score(r int) returns table(key text, correct int, base int, bonus int, pts int) language sql stable as $$
  with st as (select (settings->>'fullPoints')::int fp, (settings->>'halfPoints')::int hp, (settings->>'bonusStart')::int bs from game.state where id = 1),
  c as (
    select s.key, s.seq, (select count(*)::int from jsonb_array_elements(rd.cards) e where s.map->>(e->>'a') = e->>'id') correct
    from game.g2_sub s join game.g2_round rd on rd.round = s.round where s.round = r),
  rk as (select c.*, case when correct = 4 then row_number() over (partition by correct = 4 order by seq) end rn from c),
  b as (select rk.key, rk.correct, case rk.correct when 4 then st.fp when 2 then st.hp else 0 end base,
      case when rn is null then 0 else greatest(0, st.bs - (rn::int - 1)) end bonus from rk, st)
  select key, correct, base, bonus, base + bonus from b $$;

create or replace function game.scoreboard() returns jsonb language sql stable as $$
  with st as (select phase, round from game.state where id = 1),
  g2 as (select s.key, sum(s.pts)::int t from generate_series(0, game.g2n() - 1) i, lateral game.g2_score(i) s group by 1),
  g3 as (select s.key, sum(s.pts)::int t from generate_series(0, game.g3n() - 1) i, lateral game.g3_score(i) s group by 1),
  cur as (
    select s.key, s.pts from st, lateral game.g2_score(st.round) s where st.phase like 'g2%'
    union all select s.key, s.pts from st, lateral game.g3_score(st.round) s where st.phase like 'g3%'),
  t as (select u.id, u.name, u.group_no, gr.nick, coalesce(g2.t, 0) g2, coalesce(g3.t, 0) g3, coalesce(g2.t, 0) + coalesce(g3.t, 0) total, coalesce(cur.pts, 0) last
    from game.roster u left join game.groups gr on gr.no = u.group_no left join g2 on g2.key = u.key left join g3 on g3.key = u.key left join cur on cur.key = u.key where u.level = 'L4'),
  r as (select t.*, rank() over (order by total desc) rnk from t)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'group', group_no, 'nick', nick, 'g2', g2, 'g3', g3, 'total', total, 'last', last, 'rank', rnk) order by total desc, group_no), '[]') from r $$;

-- one computation per game step, however many devices ask
create or replace function game.board_cached() returns jsonb language plpgsql as $$
declare cur bigint; b jsonb;
begin
  select rev into cur from public.mm_tick where id = 1;
  select board into b from game.board_cache where id = 1 and rev = cur;
  if b is null then
    b := game.scoreboard();
    update game.board_cache set rev = cur, board = b where id = 1;
  end if;
  return b;
end $$;

create or replace function game.advance() returns void language plpgsql as $$
declare st game.state; rd game.g3_round; g2 int := game.g2n(); g3 int := game.g3n();
begin
  select * into st from game.state where id = 1 for update;
  case st.phase
    when 'idle' then perform game.set_phase('lobby', 0);
    when 'lobby' then perform game.set_phase('g1', 0);
    when 'g1' then perform game.set_phase('g1_end', 0);
    when 'g1_end' then perform game.set_phase('groups', 0);
    when 'groups' then perform game.set_phase('g2_intro', 0);
    when 'g2_intro' then perform game.set_phase('g2_motion', 0);
    when 'g2_motion' then perform game.set_phase('g2_countdown', st.round);
    when 'g2_countdown' then perform game.set_phase('g2_match', st.round);
    when 'g2_match' then perform game.set_phase('g2_reveal', st.round);
    when 'g2_reveal' then
      if st.recap_tab = 'answer' then update game.state set recap_tab = 'wrong' where id = 1; perform game.bump();
      else perform game.set_phase('g2_scores', st.round); end if;
    when 'g2_scores' then
      if st.round + 1 < g2 then perform game.set_phase('g2_motion', st.round + 1); else perform game.set_phase('g2_end', st.round); end if;
    when 'g2_end' then perform game.set_phase('g3_intro', 0);
    when 'g3_intro' then perform game.set_phase('g3_board', 0);
    when 'g3_board' then
      select * into rd from game.g3_round where round = st.round;
      if rd.signs < rd.sign_count then update game.g3_round set signs = signs + 1 where round = st.round; perform game.bump();
      else perform game.set_phase('g3_reveal', st.round); end if;
    when 'g3_reveal' then perform game.set_phase('g3_scores', st.round);
    when 'g3_scores' then
      if st.round + 1 < g3 then perform game.set_phase('g3_board', st.round + 1); else perform game.set_phase('final', 0); end if;
    else null;
  end case;
end $$;

create or replace function game.next_label() returns text language plpgsql stable as $$
declare st game.state; r int; g2 int := game.g2n(); g3 int := game.g3n();
begin
  select * into st from game.state where id = 1; r := st.round;
  return case st.phase
    when 'idle' then '🚀 Launch' when 'lobby' then 'เริ่มเกมที่ 1' when 'g1' then 'จบเกมที่ 1' when 'g1_end' then 'ดูการแบ่งกลุ่ม →' when 'groups' then 'ไปเกมที่ 2 →'
    when 'g2_intro' then 'เริ่มสถานการณ์ที่ 1' when 'g2_motion' then 'นับถอยหลัง 10 วิ' when 'g2_countdown' then 'ข้ามการนับ'
    when 'g2_match' then 'เฉลย'
    when 'g2_reveal' then case when st.recap_tab = 'answer' then 'ถ้าพูดผิดสไตล์ →' else 'ดูสกอร์บอร์ด' end
    when 'g2_scores' then case when r + 1 < g2 then 'สถานการณ์ที่ ' || (r + 2) || ' →' else 'สรุปเกมที่ 2' end
    when 'g2_end' then 'ไปเกมที่ 3 →' when 'g3_intro' then 'เริ่มคนที่ 1'
    when 'g3_board' then (select case when signs < sign_count then 'เปิดป้ายที่ ' || (signs + 1) else 'เฉลย' end from game.g3_round where round = r)
    when 'g3_reveal' then 'ดูสกอร์บอร์ด'
    when 'g3_scores' then case when r + 1 < g3 then 'คนที่ ' || (r + 2) || ' →' else '🏆 สรุปผล' end
    else null end;
end $$;

create or replace function game.shared_view() returns jsonb language plpgsql as $$
declare st game.state; v jsonb; sc jsonb; per jsonb; rd game.g3_round; total_p int; shown int;
begin
  select * into st from game.state where id = 1;
  select count(*) into total_p from game.roster where level = 'L4';
  v := jsonb_build_object('phase', st.phase, 'round', st.round, 'board', st.board, 'recapTab', st.recap_tab, 'endsAt', coalesce(game.ms(st.ends_at), 0),
    'g2N', game.g2n(), 'g3N', game.g3n(), 'totalPlayers', total_p, 'totalUsers', (select count(*) from game.roster), 'now', game.ms(clock_timestamp()));
  if st.phase in ('g1','g1_end') then
    v := v || jsonb_build_object('g1Done', (select count(*) from game.g1), 'g1Counts', (select jsonb_build_object(
      'bull', count(*) filter (where animal = 'bull'), 'eagle', count(*) filter (where animal = 'eagle'),
      'rat', count(*) filter (where animal = 'rat'), 'bear', count(*) filter (where animal = 'bear')) from game.g1));
  end if;
  if st.phase = 'groups' then
    v := v || jsonb_build_object('groups', (select coalesce(jsonb_agg(jsonb_build_object('no', g.no, 'nick', g.nick, 'members', (select count(*) from game.roster u where u.group_no = g.no and u.level = 'L5')) order by g.no), '[]') from game.groups g));
  end if;
  if st.phase in ('g2_motion','g2_countdown','g2_match','g2_reveal','g2_scores') then
    sc := game.cfg('scenarios')->st.round;
    v := v || jsonb_build_object('scenario', jsonb_build_object('n', sc->'n', 'title', sc->'title', 'situation', sc->'situation', 'goal', sc->'goal'),
      'submitted', (select count(*) from game.g2_sub where round = st.round));
    if st.phase in ('g2_match','g2_reveal','g2_scores') then
      v := v || jsonb_build_object('cards', (select jsonb_agg(jsonb_build_object('id', e->>'id', 't', sc->'commands'->>(e->>'a')) order by o)
        from game.g2_round r, jsonb_array_elements(r.cards) with ordinality t(e, o) where r.round = st.round));
    end if;
    if st.phase in ('g2_reveal','g2_scores') then
      v := v || jsonb_build_object('answer', (select jsonb_agg(jsonb_build_object('a', a, 'cmd', sc->'commands'->>a, 'wrong', sc->'wrong'->a) order by o) from unnest(game.animals()) with ordinality t(a, o)),
        'allCorrect', (select count(*) from game.g2_score(st.round) s where s.correct = 4));
    end if;
  end if;
  if st.phase in ('g3_board','g3_reveal','g3_scores') then
    per := game.cfg('personas')->st.round;
    select * into rd from game.g3_round where round = st.round;
    shown := case when st.phase = 'g3_board' then rd.signs else rd.sign_count end;
    v := v || jsonb_build_object('g3', jsonb_build_object('signs', shown, 'signCount', rd.sign_count, 'signPoints', rd.sign_points,
      'clues', (select coalesce(jsonb_agg(case when i < shown then per->'clues'->i else 'null'::jsonb end order by i), '[]') from generate_series(0, rd.sign_count - 1) i),
      'answered', (select count(*) from game.g3_ans where round = st.round))
      || case when st.phase <> 'g3_board' then jsonb_build_object('persona', per, 'correctCount', (select count(*) from game.g3_ans where round = st.round and correct_sign is not null)) else '{}'::jsonb end);
  end if;
  if st.phase like 'g3%' then
    v := v || jsonb_build_object('choices', (select jsonb_agg(jsonb_build_object('id', e->>'id', 'name', e->>'name', 'img', e->>'img') order by o) from jsonb_array_elements(game.cfg('personas')) with ordinality t(e, o)));
  end if;
  if st.phase in ('g2_scores','g2_end','g3_scores','final') or st.board then v := v || jsonb_build_object('scoreboard', game.board_cached()); end if;
  return v;
end $$;

create or replace function game.player_me(k text, shared jsonb) returns jsonb language plpgsql stable as $$
declare u game.roster; gr game.groups; st game.state; me jsonb; a game.g3_ans; can boolean; s record; row_ jsonb; p text;
begin
  select * into u from game.roster where key = k;
  select * into gr from game.groups where no = u.group_no;
  select * into st from game.state where id = 1; p := st.phase; can := u.level = 'L4';
  me := jsonb_build_object('id', u.id, 'name', u.name, 'level', u.level, 'store', u.store, 'canPlay', can, 'g1', (select animal from game.g1 where key = k),
    'group', case when gr.no is null then null else jsonb_build_object('no', gr.no, 'nick', gr.nick) end,
    'g1Counts', (select counts from game.g1 where key = k), 'promise', (select jsonb_build_object('gap', promise_gap, 'next', promise_next) from game.g1 where key = k));
  if p = 'groups' then
    me := me || jsonb_build_object('members', (select count(*) from game.roster x where x.group_no = u.group_no and x.level = 'L5'));
  end if;
  if p in ('g2_match','g2_reveal','g2_scores') then
    me := me || jsonb_build_object('submitted', exists(select 1 from game.g2_sub x where x.round = st.round and x.key = k));
    if p <> 'g2_match' and can then
      select * into s from game.g2_score(st.round) x where x.key = k;
      me := me || jsonb_build_object('result', case when s.key is null then null else jsonb_build_object('correct', s.correct, 'base', s.base, 'bonus', s.bonus, 'pts', s.pts) end);
    end if;
  end if;
  if shared ? 'g3' then
    select * into a from game.g3_ans x where x.round = st.round and x.key = k;
    me := me || jsonb_build_object('g3', jsonb_build_object('choice', a.choice));
    if p <> 'g3_board' and can then
      select * into s from game.g3_score(st.round) x where x.key = k;
      me := me || jsonb_build_object('result', case when s.key is null then null else jsonb_build_object('sign', s.sign, 'base', s.base, 'bonus', s.bonus, 'penalty', s.penalty, 'pts', s.pts, 'wrong', s.wrong) end);
    end if;
  end if;
  if can and shared ? 'scoreboard' then
    select e into row_ from jsonb_array_elements(shared->'scoreboard') e where e->>'id' = u.id;
    me := me || jsonb_build_object('score', row_);
  end if;
  return me;
end $$;

-- game 3 answers lock on first submit and never reveal right or wrong before the admin does
do $do$ declare d text; begin
  d := pg_get_functiondef('game.do_act(text,jsonb)'::regprocedure);
  d := replace(d, $x$    insert into game.g3_ans(round, key) values (st.round, k) on conflict do nothing;
    select * into ga from game.g3_ans where round = st.round and key = k;
    if ga.correct_sign is not null then return jsonb_build_object('ok', true); end if;
    if ga.last_wrong_sign = rd.signs then return jsonb_build_object('error', 'รอป้ายถัดไปนะ'); end if;
    if not exists(select 1 from jsonb_array_elements(game.cfg('personas')) e where e->>'id' = b->>'choice') or ga.wrong ? (b->>'choice') then return jsonb_build_object('error', 'เลือกใหม่อีกครั้ง'); end if;
    correct_id := game.cfg('personas')->st.round->>'id';
    if b->>'choice' = correct_id then
      update game.g3_ans set correct_sign = rd.signs - 1, seq = nextval('game.seq') where round = st.round and key = k;
    else
      update game.g3_ans set wrong = wrong || to_jsonb(b->>'choice'), last_wrong_sign = rd.signs where round = st.round and key = k;
    end if;$x$, $x$    if exists(select 1 from game.g3_ans where round = st.round and key = k) then return jsonb_build_object('ok', true, 'locked', true); end if;
    if not exists(select 1 from jsonb_array_elements(game.cfg('personas')) e where e->>'id' = b->>'choice') then return jsonb_build_object('error', 'เลือกใหม่อีกครั้ง'); end if;
    correct_id := game.cfg('personas')->st.round->>'id';
    if b->>'choice' = correct_id then
      insert into game.g3_ans(round, key, choice, correct_sign, seq) values (st.round, k, b->>'choice', rd.signs - 1, nextval('game.seq'));
    else
      insert into game.g3_ans(round, key, choice, wrong, last_wrong_sign) values (st.round, k, b->>'choice', jsonb_build_array(b->>'choice'), rd.signs);
    end if;$x$);
  if position('locked' in d) = 0 then raise exception 'do_act patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  d := replace(d, $x$array['lobby','g1','g1_end','g2_intro'$x$, $x$array['lobby','g1','g1_end','groups','g2_intro'$x$);
  d := replace(d, $x$t := t || jsonb_build_object('pairPoints', game.num(s->'pairPoints', (t->>'pairPoints')::int, 0, 1000),$x$, $x$t := t || jsonb_build_object('fullPoints', game.num(s->'fullPoints', (t->>'fullPoints')::int, 0, 1000), 'halfPoints', game.num(s->'halfPoints', (t->>'halfPoints')::int, 0, 1000),$x$);
  if position('fullPoints' in d) = 0 or position('''groups''' in d) = 0 then raise exception 'do_admin patch did not apply'; end if;
  execute d;
end $do$;

create or replace function public.mm_view(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare ses game.sessions; v jsonb; lvl text;
begin
  select * into ses from game.sessions where token = p_token;
  if not found then return jsonb_build_object('error', 'login'); end if;
  perform game.tick_due();
  v := game.shared_view();
  if ses.is_admin then return v || jsonb_build_object('admin', game.admin_extra()); end if;
  select level into lvl from game.roster where key = ses.key;
  if lvl is null then return jsonb_build_object('error', 'login'); end if;
  v := v || jsonb_build_object('me', game.player_me(ses.key, v));
  if lvl <> 'L4' then v := v - 'choices'; if v->>'phase' = 'g2_match' then v := v - 'cards'; end if; end if;
  return v;
end $$;

create or replace function public.mm_is_admin(p_token uuid) returns boolean language sql security definer set search_path = pg_catalog, pg_temp as $$
  select exists(select 1 from game.sessions where token = p_token and is_admin) $$;

-- live back office: never reaches the projector or players
create or replace function public.mm_monitor(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare st game.state; total int;
begin
  if not exists(select 1 from game.sessions where token = p_token and is_admin) then return jsonb_build_object('error', 'forbidden'); end if;
  select * into st from game.state where id = 1;
  return jsonb_build_object('phase', st.phase, 'round', st.round, 'label', game.next_label(),
    'title', case when st.phase like 'g2%' and st.phase not in ('g2_intro','g2_end') then game.cfg('scenarios')->st.round->>'title' when st.phase in ('g3_board','g3_reveal','g3_scores') then game.cfg('personas')->st.round->>'name' end,
    'signs', (select signs from game.g3_round where round = st.round and st.phase = 'g3_board'),
    'total', (select count(*) from game.roster), 'joined', (select count(*) from game.seen), 'g1', (select count(*) from game.g1),
    'noGroup', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'store', store)), '[]') from game.roster where group_no is null),
    'groups', (select jsonb_agg(jsonb_build_object('no', g.no, 'nick', g.nick, 'members', (select count(*) from game.roster u where u.group_no = g.no and u.level = 'L5'),
        'joined', (select count(*) from game.roster u join game.seen s on s.key = u.key where u.group_no = g.no), 'g1', (select count(*) from game.roster u join game.g1 x on x.key = u.key where u.group_no = g.no)) order by g.no) from game.groups g),
    'coaches', (select jsonb_agg(jsonb_build_object('group', u.group_no, 'nick', gr.nick, 'name', u.name, 'joined', sn.key is not null, 'animal', g1.animal,
        'g2', case when st.phase in ('g2_match','g2_reveal','g2_scores') then (select jsonb_build_object('order', (select count(*) from game.g2_sub x where x.round = st.round and x.seq <= sb.seq), 'correct', sc.correct, 'pts', sc.pts)
              from game.g2_sub sb join game.g2_score(st.round) sc on sc.key = sb.key where sb.round = st.round and sb.key = u.key) end,
        'g3', case when st.phase in ('g3_board','g3_reveal','g3_scores') then (select jsonb_build_object('choice', (select p->>'name' from jsonb_array_elements(game.cfg('personas')) p where p->>'id' = a.choice), 'sign', coalesce(a.correct_sign + 1, a.last_wrong_sign), 'correct', a.correct_sign is not null, 'pts', sc.pts, 'at', game.ms(a.at))
              from game.g3_ans a join game.g3_score(st.round) sc on sc.key = a.key where a.round = st.round and a.key = u.key) end,
        'total', (select (e->>'total')::int from jsonb_array_elements(game.scoreboard()) e where e->>'id' = u.id)) order by u.group_no)
      from game.roster u left join game.groups gr on gr.no = u.group_no left join game.seen sn on sn.key = u.key left join game.g1 g1 on g1.key = u.key where u.level = 'L4'));
end $$;

create or replace function public.mm_set_groups(p_token uuid, p_groups jsonb) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  if not exists(select 1 from game.sessions where token = p_token and is_admin) then return jsonb_build_object('error', 'forbidden'); end if;
  delete from game.store_groups where true; delete from game.groups where true;
  insert into game.groups(no, nick, en, ac_key) select (g->>'no')::int, g->>'nick', g->>'en', g->>'ac' from jsonb_array_elements(p_groups) g;
  insert into game.store_groups(code, no) select c, (g->>'no')::int from jsonb_array_elements(p_groups) g, jsonb_array_elements_text(g->'stores') c on conflict (code) do nothing;
  update game.roster u set group_no = g.no from game.groups g where g.ac_key = u.key;
  perform game.bump();
  return jsonb_build_object('ok', true, 'groups', (select count(*) from game.groups), 'stores', (select count(*) from game.store_groups));
end $$;

-- p_grp is equity or franchise. Coaches are never changed here. Staff missing from the file are removed from that group.
create or replace function public.mm_import(p_token uuid, p_grp text, p_rows jsonb, p_dry boolean) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare e jsonb; k text; g int; plan jsonb := '[]'; seen_keys text[] := '{}'; invalid jsonb := '[]'; no_group jsonb := '[]'; added int := 0; updated int := 0; kept int := 0; removed int;
begin
  if not exists(select 1 from game.sessions where token = p_token and is_admin) then return jsonb_build_object('error', 'forbidden'); end if;
  if p_grp not in ('equity','franchise') then return jsonb_build_object('error', 'ประเภทไฟล์ไม่ถูกต้อง'); end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 3000 then return jsonb_build_object('error', 'ไฟล์ไม่ถูกต้อง'); end if;
  for e in select * from jsonb_array_elements(p_rows) loop
    k := ltrim(trim(coalesce(e->>'id', '')), '0');
    if k = '' or trim(coalesce(e->>'name', '')) = '' then invalid := invalid || jsonb_build_object('id', e->>'id', 'name', e->>'name', 'why', 'ไม่มีรหัสหรือชื่อ'); continue; end if;
    if k = any(seen_keys) then invalid := invalid || jsonb_build_object('id', e->>'id', 'name', e->>'name', 'why', 'รหัสซ้ำในไฟล์'); continue; end if;
    seen_keys := seen_keys || k;
    if exists(select 1 from game.roster r where r.key = k and r.level = 'L4') then kept := kept + 1; continue; end if;
    g := null;
    if e->>'group' ~ '^[0-9]+$' then select no into g from game.groups where no = (e->>'group')::int; end if;
    if g is null then select no into g from game.store_groups where code = upper(trim(coalesce(e->>'code', ''))); end if;
    if g is null and coalesce(e->>'managerId', '') <> '' then select group_no into g from game.roster r where r.key = ltrim(trim(e->>'managerId'), '0') and r.level = 'L4'; end if;
    if g is null then no_group := no_group || jsonb_build_object('id', e->>'id', 'name', e->>'name', 'store', e->>'store'); end if;
    if exists(select 1 from game.roster r where r.key = k) then updated := updated + 1; else added := added + 1; end if;
    plan := plan || jsonb_build_object('key', k, 'id', trim(e->>'id'), 'name', trim(e->>'name'), 'store', e->>'store', 'code', upper(trim(coalesce(e->>'code', ''))), 'group', g);
  end loop;
  select count(*) into removed from game.roster r where r.grp = p_grp and r.level = 'L5' and not r.key = any(seen_keys);
  if not p_dry then
    delete from game.g1 x where x.key in (select r.key from game.roster r where r.grp = p_grp and r.level = 'L5' and not r.key = any(seen_keys));
    delete from game.seen x where x.key in (select r.key from game.roster r where r.grp = p_grp and r.level = 'L5' and not r.key = any(seen_keys));
    delete from game.sessions x where x.key in (select r.key from game.roster r where r.grp = p_grp and r.level = 'L5' and not r.key = any(seen_keys));
    delete from game.roster r where r.grp = p_grp and r.level = 'L5' and not r.key = any(seen_keys);
    insert into game.roster(key, id, name, level, grp, store, store_code, group_no)
      select e2->>'key', e2->>'id', e2->>'name', 'L5', p_grp, e2->>'store', e2->>'code', (e2->>'group')::int from jsonb_array_elements(plan) e2
      on conflict (key) do update set id = excluded.id, name = excluded.name, grp = excluded.grp, store = excluded.store, store_code = excluded.store_code, group_no = excluded.group_no;
    perform game.bump(); perform game.bump_admin();
  end if;
  return jsonb_build_object('ok', true, 'added', added, 'updated', updated, 'removed', removed, 'keptCoaches', kept, 'noGroup', no_group, 'invalid', invalid);
end $$;

create or replace function public.mm_export(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare b jsonb;
begin
  if not exists(select 1 from game.sessions where token = p_token and is_admin) then return jsonb_build_object('error', 'forbidden'); end if;
  b := game.scoreboard();
  return jsonb_build_object(
    'at', game.ms(clock_timestamp()),
    'rows', (select jsonb_agg(jsonb_build_object('id', u.id, 'name', u.name, 'level', u.level, 'group', u.grp, 'groupNo', u.group_no, 'nick', gr.nick, 'store', u.store, 'joined', sn.key is not null, 'animal', g.animal, 'counts', g.counts, 'gap', g.promise_gap, 'next', g.promise_next, 'g2', e->'g2', 'g3', e->'g3', 'total', e->'total') order by u.group_no nulls last, u.level, u.id)
      from game.roster u left join game.groups gr on gr.no = u.group_no left join game.g1 g on g.key = u.key left join game.seen sn on sn.key = u.key left join lateral (select x e from jsonb_array_elements(b) x where x->>'id' = u.id) z on true),
    'board', b,
    'g2', (select coalesce(jsonb_agg(jsonb_build_object('n', i + 1, 'title', game.cfg('scenarios')->i->>'title', 'id', u.id, 'name', u.name, 'groupNo', u.group_no, 'order', o.ord, 'correct', s.correct, 'base', s.base, 'bonus', s.bonus, 'pts', s.pts, 'pairs', o.pairs) order by i, o.ord), '[]')
      from generate_series(0, game.g2n() - 1) i cross join lateral game.g2_score(i) s join game.roster u on u.key = s.key
      cross join lateral (select (select count(*) from game.g2_sub x where x.round = i and x.seq <= sb.seq) ord,
        (select jsonb_object_agg(c->>'a', sb.map->>(c->>'a') = c->>'id') from game.g2_round rd, jsonb_array_elements(rd.cards) c where rd.round = i) pairs
        from game.g2_sub sb where sb.round = i and sb.key = s.key) o),
    'g3', (select coalesce(jsonb_agg(jsonb_build_object('n', i + 1, 'persona', game.cfg('personas')->i->>'name', 'id', u.id, 'name', u.name, 'groupNo', u.group_no, 'choice', w.names, 'sign', coalesce(s.sign + 1, w.ws), 'correct', s.sign is not null, 'base', s.base, 'bonus', s.bonus, 'penalty', s.penalty, 'pts', s.pts) order by i, s.bonus desc, u.group_no), '[]')
      from generate_series(0, game.g3n() - 1) i cross join lateral game.g3_score(i) s join game.roster u on u.key = s.key
      cross join lateral (select (select p->>'name' from jsonb_array_elements(game.cfg('personas')) p where p->>'id' = a.choice) names, a.last_wrong_sign ws from game.g3_ans a where a.round = i and a.key = s.key) w));
end $$;

revoke all on all functions in schema game from public, anon, authenticated;
revoke all on function public.mm_is_admin(uuid), public.mm_monitor(uuid), public.mm_set_groups(uuid, jsonb), public.mm_import(uuid, text, jsonb, boolean), public.mm_export(uuid), public.mm_view(uuid) from public;
grant execute on function public.mm_is_admin(uuid), public.mm_monitor(uuid), public.mm_set_groups(uuid, jsonb), public.mm_import(uuid, text, jsonb, boolean), public.mm_export(uuid), public.mm_view(uuid) to anon, authenticated;
