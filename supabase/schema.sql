-- Bonchon Manager Meeting Game. Run once in the Supabase SQL editor, then run private/seed.sql.
-- All game rules live here. Browsers only get the mm_* functions and an empty change signal.
create schema if not exists game;
revoke all on schema game from public, anon, authenticated;

create table if not exists game.config(k text primary key, v jsonb not null);
create table if not exists game.roster(key text primary key, id text not null, name text not null, level text not null, grp text not null, store text);
create table if not exists game.sessions(token uuid primary key default gen_random_uuid(), key text, is_admin boolean not null default false, at timestamptz default now());
create table if not exists game.seen(key text primary key, at timestamptz default now());
create table if not exists game.state(id int primary key default 1 check (id = 1), phase text not null default 'idle', round int not null default 0, board boolean not null default false, recap_tab text not null default 'answer', ends_at timestamptz,
  settings jsonb not null default '{"pairPoints":10,"bonusStart":15,"signCount":4,"signPoints":[100,75,50,25],"wrongPenalty":0}');
insert into game.state(id) values (1) on conflict do nothing;
create table if not exists game.g1(key text primary key, animal text not null, counts jsonb, at timestamptz default now(), promise_gap text, promise_next text);
create table if not exists game.g2_round(round int primary key, cards jsonb not null);
create table if not exists game.g2_sub(round int, key text, map jsonb not null, seq bigint not null, primary key(round, key));
create table if not exists game.g3_round(round int primary key, sign_count int not null, sign_points jsonb not null, signs int not null default 0);
create table if not exists game.g3_ans(round int, key text, wrong jsonb not null default '[]', last_wrong_sign int, correct_sign int, seq bigint, primary key(round, key));
create sequence if not exists game.seq;

-- change signals hold only counters, no data. mm_tick goes to every device when the admin moves the game;
-- mm_tick_admin goes to the admin screen only, so logins and answers do not fan out to all 130 devices.
create table if not exists public.mm_tick(id int primary key default 1 check (id = 1), rev bigint not null default 0);
create table if not exists public.mm_tick_admin(id int primary key default 1 check (id = 1), rev bigint not null default 0);
insert into public.mm_tick_admin(id) values (1) on conflict do nothing;
alter table public.mm_tick_admin enable row level security;
drop policy if exists mm_tick_admin_read on public.mm_tick_admin;
create policy mm_tick_admin_read on public.mm_tick_admin for select to anon, authenticated using (true);
revoke all on public.mm_tick_admin from anon, authenticated;
grant select on public.mm_tick_admin to anon, authenticated;
insert into public.mm_tick(id) values (1) on conflict do nothing;
alter table public.mm_tick enable row level security;
drop policy if exists mm_tick_read on public.mm_tick;
create policy mm_tick_read on public.mm_tick for select to anon, authenticated using (true);
revoke all on public.mm_tick from anon, authenticated;
grant select on public.mm_tick to anon, authenticated;
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'mm_tick') then
    alter publication supabase_realtime add table public.mm_tick;
    alter publication supabase_realtime add table public.mm_tick_admin;
  end if;
end $$;

-- ---------- helpers ----------
create or replace function game.cfg(p text) returns jsonb language sql stable as $$ select v from game.config where k = p $$;
create or replace function game.animals() returns text[] language sql immutable as $$ select array['bull','eagle','rat','bear'] $$;
create or replace function game.bump() returns void language sql as $$ update public.mm_tick set rev = rev + 1 where id = 1 $$;
create or replace function game.bump_admin() returns void language sql as $$ update public.mm_tick_admin set rev = rev + 1 where id = 1 $$;
create or replace function game.g2n() returns int language sql stable as $$ select jsonb_array_length(game.cfg('scenarios')) $$;
create or replace function game.g3n() returns int language sql stable as $$ select jsonb_array_length(game.cfg('personas')) $$;
create or replace function game.ms(t timestamptz) returns bigint language sql stable as $$ select (extract(epoch from t) * 1000)::bigint $$;
create or replace function game.num(x jsonb, d int, lo int, hi int) returns int language sql immutable as $$
  select case when x is not null and trim(both '"' from x::text) ~ '^-?[0-9]+(\.[0-9]+)?$'
    then least(hi, greatest(lo, round(trim(both '"' from x::text)::numeric)::int)) else d end $$;

create or replace function game.g2_ensure(r int) returns void language sql as $$
  insert into game.g2_round(round, cards)
  select r, jsonb_agg(jsonb_build_object('id', substr(md5(random()::text || a), 1, 8), 'a', a) order by random())
  from unnest(game.animals()) a on conflict do nothing $$;

create or replace function game.g3_ensure(r int) returns void language plpgsql as $$
declare st game.state; n int;
begin
  select * into st from game.state where id = 1;
  n := least((st.settings->>'signCount')::int, jsonb_array_length(game.cfg('personas')->r->'clues'));
  insert into game.g3_round(round, sign_count, sign_points)
  select r, n, coalesce((select jsonb_agg(e order by o) from jsonb_array_elements(st.settings->'signPoints') with ordinality t(e, o) where o <= n), '[]')
  on conflict do nothing;
end $$;

-- ---------- scoring ----------
create or replace function game.g2_score(r int) returns table(key text, correct int, base int, bonus int, pts int) language sql stable as $$
  with st as (select (settings->>'pairPoints')::int pp, (settings->>'bonusStart')::int bs from game.state where id = 1),
  c as (
    select s.key, s.seq, (select count(*)::int from jsonb_array_elements(rd.cards) e where s.map->>(e->>'a') = e->>'id') correct
    from game.g2_sub s join game.g2_round rd on rd.round = s.round where s.round = r),
  rk as (select c.*, case when correct = 4 then row_number() over (partition by correct = 4 order by seq) end rn from c)
  select rk.key, rk.correct, rk.correct * st.pp, case when rn is null then 0 else greatest(0, st.bs - (rn::int - 1)) end,
         rk.correct * st.pp + case when rn is null then 0 else greatest(0, st.bs - (rn::int - 1)) end
  from rk, st $$;

create or replace function game.g3_score(r int) returns table(key text, sign int, base int, bonus int, penalty int, pts int, wrong int) language sql stable as $$
  with st as (select (settings->>'bonusStart')::int bs, (settings->>'wrongPenalty')::int wp from game.state where id = 1),
  rk as (select a.*, case when correct_sign is not null then row_number() over (partition by correct_sign is not null order by a.seq) end rn from game.g3_ans a where a.round = r),
  b as (select rk.key, rk.correct_sign sign,
      case when rk.correct_sign is null then 0 else coalesce((rd.sign_points->>rk.correct_sign)::int, 0) end base,
      case when rn is null then 0 else greatest(0, st.bs - (rn::int - 1)) end bonus,
      jsonb_array_length(rk.wrong) * st.wp penalty, jsonb_array_length(rk.wrong) wrong
    from rk join game.g3_round rd on rd.round = rk.round, st)
  select key, sign, base, bonus, penalty, base + bonus - penalty, wrong from b $$;

create or replace function game.scoreboard() returns jsonb language sql stable as $$
  with st as (select phase, round from game.state where id = 1),
  g2 as (select s.key, sum(s.pts)::int t from generate_series(0, game.g2n() - 1) i, lateral game.g2_score(i) s group by 1),
  g3 as (select s.key, sum(s.pts)::int t from generate_series(0, game.g3n() - 1) i, lateral game.g3_score(i) s group by 1),
  cur as (
    select s.key, s.pts from st, lateral game.g2_score(st.round) s where st.phase like 'g2%'
    union all select s.key, s.pts from st, lateral game.g3_score(st.round) s where st.phase like 'g3%'),
  t as (select u.id, u.name, coalesce(g2.t, 0) g2, coalesce(g3.t, 0) g3, coalesce(g2.t, 0) + coalesce(g3.t, 0) total, coalesce(cur.pts, 0) last
    from game.roster u left join g2 on g2.key = u.key left join g3 on g3.key = u.key left join cur on cur.key = u.key where u.level = 'L4'),
  r as (select t.*, rank() over (order by total desc) rnk from t)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'g2', g2, 'g3', g3, 'total', total, 'last', last, 'rank', rnk) order by total desc, name), '[]') from r $$;

-- ---------- phase machine ----------
create or replace function game.set_phase(p text, r int) returns void language plpgsql as $$
begin
  update game.state set phase = p, round = r, board = false, recap_tab = 'answer',
    ends_at = case when p = 'g2_countdown' then now() + interval '10 seconds' end where id = 1;
  if p in ('g2_motion','g2_countdown','g2_match','g2_reveal','g2_scores') then perform game.g2_ensure(r); end if;
  if p = 'g3_board' then perform game.g3_ensure(r); end if;
  perform game.bump();
end $$;

create or replace function game.tick_due() returns void language plpgsql as $$
declare r int;
begin
  update game.state set ends_at = null where id = 1 and phase = 'g2_countdown' and ends_at <= now() returning round into r;
  if found then perform game.set_phase('g2_match', r); end if;
end $$;

create or replace function game.advance() returns void language plpgsql as $$
declare st game.state; rd game.g3_round; g2 int := game.g2n(); g3 int := game.g3n();
begin
  select * into st from game.state where id = 1 for update;
  case st.phase
    when 'idle' then perform game.set_phase('lobby', 0);
    when 'lobby' then perform game.set_phase('g1', 0);
    when 'g1' then perform game.set_phase('g1_end', 0);
    when 'g1_end' then perform game.set_phase('g2_intro', 0);
    when 'g2_intro' then perform game.set_phase('g2_motion', 0);
    when 'g2_motion' then perform game.set_phase('g2_countdown', st.round);
    when 'g2_countdown' then perform game.set_phase('g2_match', st.round);
    when 'g2_match' then perform game.set_phase('g2_reveal', st.round);
    when 'g2_reveal' then perform game.set_phase('g2_scores', st.round);
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
declare st game.state; rd game.g3_round; r int; g2 int := game.g2n(); g3 int := game.g3n();
begin
  select * into st from game.state where id = 1; r := st.round;
  return case st.phase
    when 'idle' then '🚀 Launch' when 'lobby' then 'เริ่มเกมที่ 1' when 'g1' then 'จบเกมที่ 1' when 'g1_end' then 'ไปเกมที่ 2 →'
    when 'g2_intro' then 'เริ่มสถานการณ์ที่ 1' when 'g2_motion' then 'นับถอยหลัง 10 วิ' when 'g2_countdown' then 'ข้ามการนับ'
    when 'g2_match' then 'เฉลย' when 'g2_reveal' then 'ดูสกอร์บอร์ด'
    when 'g2_scores' then case when r + 1 < g2 then 'สถานการณ์ที่ ' || (r + 2) || ' →' else 'สรุปเกมที่ 2' end
    when 'g2_end' then 'ไปเกมที่ 3 →' when 'g3_intro' then 'เริ่มคนที่ 1'
    when 'g3_board' then (select case when signs < sign_count then 'เปิดป้ายที่ ' || (signs + 1) else 'เฉลย' end from game.g3_round where round = r)
    when 'g3_reveal' then 'ดูสกอร์บอร์ด'
    when 'g3_scores' then case when r + 1 < g3 then 'คนที่ ' || (r + 2) || ' →' else '🏆 สรุปผล' end
    else null end;
end $$;

-- ---------- views ----------
create or replace function game.shared_view() returns jsonb language plpgsql stable as $$
declare st game.state; v jsonb; sc jsonb; per jsonb; rd game.g3_round; total_p int; shown int; ids text[];
begin
  select * into st from game.state where id = 1;
  select count(*) into total_p from game.roster where level = 'L4';
  v := jsonb_build_object('phase', st.phase, 'round', st.round, 'board', st.board, 'recapTab', st.recap_tab, 'endsAt', coalesce(game.ms(st.ends_at), 0),
    'g2N', game.g2n(), 'g3N', game.g3n(), 'totalPlayers', total_p, 'totalUsers', (select count(*) from game.roster), 'now', game.ms(clock_timestamp()));
  if st.phase in ('g1','g1_end') then
    v := v || jsonb_build_object('g1Done', (select count(*) from game.g1), 'g1Counts', jsonb_build_object(
      'bull', (select count(*) from game.g1 where animal = 'bull'), 'eagle', (select count(*) from game.g1 where animal = 'eagle'),
      'rat', (select count(*) from game.g1 where animal = 'rat'), 'bear', (select count(*) from game.g1 where animal = 'bear')));
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
      'answered', (select count(*) from game.g3_ans where round = st.round),
      'correctCount', (select count(*) from game.g3_ans where round = st.round and correct_sign is not null))
      || case when st.phase <> 'g3_board' then jsonb_build_object('persona', per) else '{}'::jsonb end);
  end if;
  if st.phase like 'g3%' then
    v := v || jsonb_build_object('choices', (select jsonb_agg(jsonb_build_object('id', e->>'id', 'name', e->>'name', 'img', e->>'img') order by o) from jsonb_array_elements(game.cfg('personas')) with ordinality t(e, o)));
  end if;
  if st.phase in ('g2_scores','g2_end','g3_scores','final') or st.board then v := v || jsonb_build_object('scoreboard', game.scoreboard()); end if;
  return v;
end $$;

create or replace function game.player_me(k text, shared jsonb) returns jsonb language plpgsql stable as $$
declare u game.roster; st game.state; me jsonb; a game.g3_ans; rd game.g3_round; can boolean; s record; row_ jsonb; p text;
begin
  select * into u from game.roster where key = k;
  select * into st from game.state where id = 1; p := st.phase; can := u.level = 'L4';
  me := jsonb_build_object('id', u.id, 'name', u.name, 'level', u.level, 'store', u.store, 'canPlay', can, 'g1', (select animal from game.g1 where key = k),
    'g1Counts', (select counts from game.g1 where key = k), 'promise', (select jsonb_build_object('gap', promise_gap, 'next', promise_next) from game.g1 where key = k));
  if p in ('g2_match','g2_reveal','g2_scores') then
    me := me || jsonb_build_object('submitted', exists(select 1 from game.g2_sub x where x.round = st.round and x.key = k));
    if p <> 'g2_match' and can then
      select * into s from game.g2_score(st.round) x where x.key = k;
      me := me || jsonb_build_object('result', case when s.key is null then null else jsonb_build_object('correct', s.correct, 'base', s.base, 'bonus', s.bonus, 'pts', s.pts) end);
    end if;
  end if;
  if shared ? 'g3' then
    select * into a from game.g3_ans x where x.round = st.round and x.key = k;
    select * into rd from game.g3_round x where x.round = st.round;
    me := me || jsonb_build_object('g3', jsonb_build_object('wrong', coalesce(a.wrong, '[]'), 'correct', a.correct_sign is not null, 'wrongThisSign', a.last_wrong_sign is not null and a.last_wrong_sign = rd.signs));
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

create or replace function game.admin_extra() returns jsonb language sql stable as $$
  select jsonb_build_object('nextLabel', game.next_label(), 'settings', (select settings from game.state where id = 1),
    'draftAssessment', coalesce((game.cfg('assessment')->>'draft')::boolean, false),
    'joined', (select coalesce(jsonb_agg(jsonb_build_object('n', u.name, 'l', u.level) order by s.at), '[]') from game.seen s join game.roster u on u.key = s.key),
    'scenarios', (select jsonb_agg(jsonb_build_object('n', e->'n', 'title', e->'title') order by o) from jsonb_array_elements(game.cfg('scenarios')) with ordinality t(e, o)),
    'personas', (select jsonb_agg(jsonb_build_object('name', e->'name', 'clues', jsonb_array_length(e->'clues')) order by o) from jsonb_array_elements(game.cfg('personas')) with ordinality t(e, o))) $$;

-- ---------- player actions ----------
create or replace function game.do_act(k text, b jsonb) returns jsonb language plpgsql as $$
declare st game.state; u game.roster; q jsonb; ans jsonb; i int; idx int; o jsonb; a text; c jsonb := '{"bull":0,"eagle":0,"rat":0,"bear":0}'; winner text; best int := 0; tied text[]; tb jsonb;
  rd game.g3_round; ga game.g3_ans; ids text[]; vals text[]; correct_id text;
begin
  select * into st from game.state where id = 1 for update;
  select * into u from game.roster where key = k;
  case b->>'type'
  when 'g1' then
    if st.phase in ('idle','lobby') then return jsonb_build_object('error', 'ยังไม่เริ่มเกม'); end if;
    select animal into a from game.g1 where key = k;
    if a is not null then return jsonb_build_object('ok', true, 'animal', a); end if;
    q := game.cfg('assessment')->'questions'; ans := b->'answers';
    if ans is null or jsonb_typeof(ans) <> 'array' or jsonb_array_length(ans) <> jsonb_array_length(q) then return jsonb_build_object('error', 'ตอบไม่ครบ'); end if;
    for i in 0 .. jsonb_array_length(q) - 1 loop
      if jsonb_typeof(ans->i) <> 'number' then return jsonb_build_object('error', 'คำตอบไม่ถูกต้อง'); end if;
      o := q->i->'options'->((ans->>i)::int);
      if o is null then return jsonb_build_object('error', 'คำตอบไม่ถูกต้อง'); end if;
      a := o->>'a';
      c := jsonb_set(c, array[a], to_jsonb((c->>a)::int + 1));
    end loop;
    select max(v::int) into best from jsonb_each_text(c) x(n, v);
    select array_agg(x order by pos) into tied from unnest(game.animals()) with ordinality t(x, pos) where (c->>x)::int = best;
    -- tie: the answer to the pressure questions (1 then 7) decides, otherwise A > B > C > D
    for tb in select e from jsonb_array_elements(coalesce(game.cfg('assessment')->'tiebreak', '[]')) e loop
      a := q->((tb#>>'{}')::int)->'options'->((ans->>((tb#>>'{}')::int))::int)->>'a';
      if a = any(tied) then winner := a; exit; end if;
    end loop;
    winner := coalesce(winner, tied[1]);
    insert into game.g1(key, animal, counts) values (k, winner, c);
    perform game.bump_admin();
    return jsonb_build_object('ok', true, 'animal', winner, 'counts', c);
  when 'g1promise' then
    update game.g1 set promise_gap = left(b->>'gap', 300), promise_next = left(b->>'next', 300) where key = k;
    if not found then return jsonb_build_object('error', 'ทำแบบประเมินก่อนนะ'); end if;
    return jsonb_build_object('ok', true);
  when 'g2' then
    if u.level <> 'L4' then return jsonb_build_object('error', 'เกมนี้สำหรับ Area Coach'); end if;
    if st.phase <> 'g2_match' then return jsonb_build_object('error', 'หมดเวลาตอบแล้ว'); end if;
    if exists(select 1 from game.g2_sub where round = st.round and key = k) then return jsonb_build_object('ok', true); end if;
    select array_agg(e->>'id') into ids from game.g2_round r, jsonb_array_elements(r.cards) e where r.round = st.round;
    select array_agg(b->'map'->>x) into vals from unnest(game.animals()) x;
    if exists(select 1 from unnest(vals) v where v is null or not v = any(ids)) or (select count(distinct v) from unnest(vals) v) <> 4 then return jsonb_build_object('error', 'ต้องโยงให้ครบ 4 คู่'); end if;
    insert into game.g2_sub(round, key, map, seq) values (st.round, k, (select jsonb_object_agg(x, b->'map'->>x) from unnest(game.animals()) x), nextval('game.seq'));
    perform game.bump_admin();
    return jsonb_build_object('ok', true);
  when 'g3' then
    if u.level <> 'L4' then return jsonb_build_object('error', 'เกมนี้สำหรับ Area Coach'); end if;
    if st.phase <> 'g3_board' then return jsonb_build_object('error', 'หมดเวลาตอบแล้ว'); end if;
    select * into rd from game.g3_round where round = st.round;
    if rd.signs < 1 then return jsonb_build_object('error', 'รอเปิดป้ายแรก'); end if;
    insert into game.g3_ans(round, key) values (st.round, k) on conflict do nothing;
    select * into ga from game.g3_ans where round = st.round and key = k;
    if ga.correct_sign is not null then return jsonb_build_object('ok', true); end if;
    if ga.last_wrong_sign = rd.signs then return jsonb_build_object('error', 'รอป้ายถัดไปนะ'); end if;
    if not exists(select 1 from jsonb_array_elements(game.cfg('personas')) e where e->>'id' = b->>'choice') or ga.wrong ? (b->>'choice') then return jsonb_build_object('error', 'เลือกใหม่อีกครั้ง'); end if;
    correct_id := game.cfg('personas')->st.round->>'id';
    if b->>'choice' = correct_id then
      update game.g3_ans set correct_sign = rd.signs - 1, seq = nextval('game.seq') where round = st.round and key = k;
    else
      update game.g3_ans set wrong = wrong || to_jsonb(b->>'choice'), last_wrong_sign = rd.signs where round = st.round and key = k;
    end if;
    perform game.bump_admin();
    return jsonb_build_object('ok', true);
  else return jsonb_build_object('error', 'unknown');
  end case;
end $$;

-- ---------- admin ----------
create or replace function game.do_admin(b jsonb) returns jsonb language plpgsql as $$
declare st game.state; s jsonb := b->'settings'; t jsonb; n int; pts jsonb; r int;
begin
  select * into st from game.state where id = 1 for update;
  case b->>'cmd'
  when 'next' then perform game.advance();
  when 'board' then update game.state set board = coalesce((b->>'on')::boolean, false) where id = 1; perform game.bump();
  when 'recapTab' then update game.state set recap_tab = case when b->>'tab' = 'wrong' then 'wrong' else 'answer' end where id = 1; perform game.bump();
  when 'goto' then
    if not (b->>'phase' = any(array['lobby','g1','g1_end','g2_intro','g2_motion','g2_end','g3_intro','g3_board','final'])) then return jsonb_build_object('error', 'bad phase'); end if;
    n := case when b->>'phase' = 'g2_motion' then game.g2n() else game.g3n() end;
    r := greatest(0, least(n - 1, game.num(b->'round', 0, 0, 1000)));
    if (b->>'clear')::boolean and b->>'phase' = 'g2_motion' then delete from game.g2_sub where round = r; delete from game.g2_round where round = r; end if;
    if (b->>'clear')::boolean and b->>'phase' = 'g3_board' then delete from game.g3_ans where round = r; delete from game.g3_round where round = r; end if;
    perform game.set_phase(b->>'phase', r);
  when 'settings' then
    t := st.settings;
    t := t || jsonb_build_object('pairPoints', game.num(s->'pairPoints', (t->>'pairPoints')::int, 0, 1000),
      'bonusStart', game.num(s->'bonusStart', (t->>'bonusStart')::int, 0, 1000),
      'signCount', game.num(s->'signCount', (t->>'signCount')::int, 1, 5),
      'wrongPenalty', game.num(s->'wrongPenalty', (t->>'wrongPenalty')::int, 0, 1000));
    pts := t->'signPoints';
    if jsonb_typeof(s->'signPoints') = 'array' then
      select coalesce(jsonb_agg(game.num(e, 0, 0, 10000) order by o), '[]') into pts from jsonb_array_elements(s->'signPoints') with ordinality x(e, o) where o <= 5;
    end if;
    while jsonb_array_length(pts) < (t->>'signCount')::int loop pts := pts || '0'::jsonb; end loop;
    update game.state set settings = t || jsonb_build_object('signPoints', pts) where id = 1;
    perform game.bump();
  when 'resetScores' then delete from game.g2_sub where true; delete from game.g2_round where true; delete from game.g3_ans where true; delete from game.g3_round where true; perform game.bump();
  when 'resetAll' then
    delete from game.g1 where true; delete from game.seen where true; delete from game.g2_sub where true; delete from game.g2_round where true; delete from game.g3_ans where true; delete from game.g3_round where true;
    update game.state set phase = 'idle', round = 0, board = false, recap_tab = 'answer', ends_at = null where id = 1;
    perform game.bump();
  else return jsonb_build_object('error', 'unknown');
  end case;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- the only functions browsers may call ----------
create or replace function public.mm_login(p_id text, p_password text) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare id_ text := trim(coalesce(p_id, '')); k text; tok uuid; h text := encode(sha256(convert_to(coalesce(p_password, ''), 'UTF8')), 'hex');
begin
  if lower(id_) = game.cfg('admin_user')#>>'{}' then
    if h <> game.cfg('admin_pw_hash')#>>'{}' then return jsonb_build_object('error', 'รหัสผ่านไม่ถูกต้อง'); end if;
    insert into game.sessions(is_admin) values (true) returning token into tok;
    return jsonb_build_object('token', tok, 'admin', true);
  end if;
  k := ltrim(id_, '0');
  if not exists(select 1 from game.roster r where r.key = k) or h <> game.cfg('user_pw_hash')#>>'{}' then
    return jsonb_build_object('error', 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง');
  end if;
  insert into game.seen(key) values (k) on conflict do nothing;
  insert into game.sessions(key) values (k) returning token into tok;
  perform game.bump_admin();
  return jsonb_build_object('token', tok);
end $$;

create or replace function public.mm_view(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare ses game.sessions; v jsonb;
begin
  select * into ses from game.sessions where token = p_token;
  if not found then return jsonb_build_object('error', 'login'); end if;
  perform game.tick_due();
  v := game.shared_view();
  if ses.is_admin then return v || jsonb_build_object('admin', game.admin_extra()); end if;
  return v || jsonb_build_object('me', game.player_me(ses.key, v));
end $$;

create or replace function public.mm_assessment(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  if not exists(select 1 from game.sessions where token = p_token) then return jsonb_build_object('error', 'login'); end if;
  return jsonb_build_object('questions', (select jsonb_agg(jsonb_build_object('q', q->'q', 'options', (select jsonb_agg(o->'t' order by n) from jsonb_array_elements(q->'options') with ordinality x(o, n))) order by i)
    from jsonb_array_elements(game.cfg('assessment')->'questions') with ordinality y(q, i)));
end $$;

create or replace function public.mm_act(p_token uuid, p_body jsonb) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare ses game.sessions;
begin
  select * into ses from game.sessions where token = p_token;
  if not found or ses.is_admin then return jsonb_build_object('error', 'login'); end if;
  perform game.tick_due();
  return game.do_act(ses.key, p_body);
end $$;

create or replace function public.mm_admin(p_token uuid, p_body jsonb) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  if not exists(select 1 from game.sessions where token = p_token and is_admin) then return jsonb_build_object('error', 'forbidden'); end if;
  perform game.tick_due();
  return game.do_admin(p_body);
end $$;

create or replace function public.mm_export(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare b jsonb;
begin
  if not exists(select 1 from game.sessions where token = p_token and is_admin) then return jsonb_build_object('error', 'forbidden'); end if;
  b := game.scoreboard();
  return jsonb_build_object(
    'at', game.ms(clock_timestamp()),
    'rows', (select jsonb_agg(jsonb_build_object('id', u.id, 'name', u.name, 'level', u.level, 'group', u.grp, 'store', u.store, 'joined', sn.key is not null, 'animal', g.animal, 'counts', g.counts, 'gap', g.promise_gap, 'next', g.promise_next, 'g2', e->'g2', 'g3', e->'g3', 'total', e->'total') order by u.level, u.id)
      from game.roster u left join game.g1 g on g.key = u.key left join game.seen sn on sn.key = u.key left join lateral (select x e from jsonb_array_elements(b) x where x->>'id' = u.id) z on true),
    'board', b,
    'g2', (select coalesce(jsonb_agg(jsonb_build_object('n', i + 1, 'title', game.cfg('scenarios')->i->>'title', 'id', u.id, 'name', u.name, 'order', o.ord, 'correct', s.correct, 'base', s.base, 'bonus', s.bonus, 'pts', s.pts, 'pairs', o.pairs) order by i, o.ord), '[]')
      from generate_series(0, game.g2n() - 1) i cross join lateral game.g2_score(i) s join game.roster u on u.key = s.key
      cross join lateral (select (select count(*) from game.g2_sub x where x.round = i and x.seq <= sb.seq) ord,
        (select jsonb_object_agg(c->>'a', sb.map->>(c->>'a') = c->>'id') from game.g2_round rd, jsonb_array_elements(rd.cards) c where rd.round = i) pairs
        from game.g2_sub sb where sb.round = i and sb.key = s.key) o),
    'g3', (select coalesce(jsonb_agg(jsonb_build_object('n', i + 1, 'persona', game.cfg('personas')->i->>'name', 'id', u.id, 'name', u.name, 'sign', s.sign, 'wrong', s.wrong, 'wrongNames', w.names, 'base', s.base, 'bonus', s.bonus, 'penalty', s.penalty, 'pts', s.pts) order by i, s.sign nulls last, s.bonus desc), '[]')
      from generate_series(0, game.g3n() - 1) i cross join lateral game.g3_score(i) s join game.roster u on u.key = s.key
      cross join lateral (select (select string_agg(p->>'name', ', ') from jsonb_array_elements(game.cfg('personas')) p where a.wrong ? (p->>'id')) names from game.g3_ans a where a.round = i and a.key = s.key) w));
end $$;

revoke all on all functions in schema game from public, anon, authenticated;
revoke all on function public.mm_login(text, text), public.mm_view(uuid), public.mm_assessment(uuid), public.mm_act(uuid, jsonb), public.mm_admin(uuid, jsonb), public.mm_export(uuid) from public;
grant execute on function public.mm_login(text, text), public.mm_view(uuid), public.mm_assessment(uuid), public.mm_act(uuid, jsonb), public.mm_admin(uuid, jsonb), public.mm_export(uuid) to anon, authenticated;
