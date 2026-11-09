-- Before game 1: everyone (L4 and L5) picks 3 of 9 Good GEL behaviours, the room sees the results as a bar chart,
-- then two deck pages (Good GEL, รู้จักตัวเองก่อน) lead into game 1. Run after update_13.sql.
create table if not exists game.gel_vote(key text primary key, picks int[] not null, at timestamptz not null default now());
alter table game.gel_vote enable row level security;

-- vote counts per behaviour (0-8), overall and by level
create or replace function game.gv_info() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'counts', (select jsonb_agg((select count(*) from game.gel_vote v where i = any(v.picks)) order by i) from generate_series(0, 8) i),
    'l4', (select jsonb_agg((select count(*) from game.gel_vote v join game.roster r on r.key = v.key where r.level = 'L4' and i = any(v.picks)) order by i) from generate_series(0, 8) i),
    'l5', (select jsonb_agg((select count(*) from game.gel_vote v join game.roster r on r.key = v.key where r.level = 'L5' and i = any(v.picks)) order by i) from generate_series(0, 8) i),
    'voters', (select count(*) from game.gel_vote v join game.roster r on r.key = v.key),
    'people', (select count(*) from game.roster)) $$;

do $do$ declare d text; begin
  -- flow: lobby → gvote → gvres → p1 (2 slides) → g1
  d := pg_get_functiondef('game.advance()'::regprocedure);
  if position('gvote' in d) = 0 then
    d := replace(d, $x$when 'lobby' then perform game.set_phase('g1', 0);$x$, $x$when 'lobby' then perform game.set_phase('gvote', 0);
    when 'gvote' then perform game.set_phase('gvres', 0);
    when 'gvres' then perform game.set_phase('p1', 0);
    when 'p1' then
      if st.round < 1 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('g1', 0); end if;$x$);
    if position('gvote' in d) = 0 then raise exception 'advance patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.next_label()'::regprocedure);
  if position('gvote' in d) = 0 then
    d := replace(d, $x$when 'lobby' then 'เริ่มเกมที่ 1'$x$, $x$when 'lobby' then 'GEL ที่ดีต้องมีพฤติกรรมอะไร? →' when 'gvote' then '📊 ดูผลโหวต' when 'gvres' then 'Good GEL →'
    when 'p1' then case when r < 1 then 'รู้จักตัวเองก่อน →' else 'เริ่มเกมที่ 1' end$x$);
    if position('gvote' in d) = 0 then raise exception 'label patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  if position('gvote' in d) = 0 then
    d := replace(d, $x$array['lobby','g1',$x$, $x$array['lobby','gvote','gvres','p1','g1',$x$);
    d := replace(d, $x$delete from game.g1 where true; delete from game.seen where true;$x$, $x$delete from game.g1 where true; delete from game.gel_vote where true; delete from game.seen where true;$x$);
    if position('gvote' in d) = 0 or position('gel_vote' in d) = 0 then raise exception 'admin patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.do_act(text,jsonb)'::regprocedure);
  if position('gelvote' in d) = 0 then
    d := replace(d, $x$if st.phase in ('idle','lobby') then return jsonb_build_object('error', 'ยังไม่เริ่มเกม'); end if;$x$, $x$if st.phase in ('idle','lobby','gvote','gvres','p1') then return jsonb_build_object('error', 'ยังไม่เริ่มเกม'); end if;$x$);
    d := replace(d, $x$  else return jsonb_build_object('error', 'unknown');$x$, $x$  when 'gelvote' then
    if st.phase <> 'gvote' then return jsonb_build_object('error', 'ปิดโหวตแล้ว'); end if;
    if jsonb_typeof(b->'picks') <> 'array' or jsonb_array_length(b->'picks') <> 3
      or exists(select 1 from jsonb_array_elements(b->'picks') e where jsonb_typeof(e) <> 'number' or (e#>>'{}')::numeric not in (0,1,2,3,4,5,6,7,8))
      or (select count(distinct e#>>'{}') from jsonb_array_elements(b->'picks') e) <> 3 then return jsonb_build_object('error', 'เลือกให้ครบ 3 ข้อ'); end if;
    insert into game.gel_vote(key, picks) select k, array_agg((e#>>'{}')::int) from jsonb_array_elements(b->'picks') e
      on conflict (key) do update set picks = excluded.picks, at = now();
    perform game.bump_admin();
    return jsonb_build_object('ok', true);
  else return jsonb_build_object('error', 'unknown');$x$);
    if position('gelvote' in d) = 0 or position('''gvote'',''gvres''' in d) = 0 then raise exception 'act patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.shared_view()'::regprocedure);
  if position('gv_info' in d) = 0 then
    d := replace(d, $x$  if st.phase in ('g3_board','g3_reveal','g3_scores') then$x$, $x$  if st.phase in ('gvote','gvres') then v := v || jsonb_build_object('gv', game.gv_info()); end if;
  if st.phase in ('g3_board','g3_reveal','g3_scores') then$x$);
    if position('gv_info' in d) = 0 then raise exception 'view patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('public.mm_view(uuid)'::regprocedure);
  if position('gel_vote' in d) = 0 then
    d := replace(d, $x$v := v || jsonb_build_object('me', game.player_me(ses.key, v));$x$, $x$v := v || jsonb_build_object('me', game.player_me(ses.key, v) || jsonb_build_object('gvPicks', (select to_jsonb(x.picks) from game.gel_vote x where x.key = ses.key)));$x$);
    if position('gel_vote' in d) = 0 then raise exception 'mm_view patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('public.mm_export(uuid)'::regprocedure);
  if position('gel_vote' in d) = 0 then
    d := replace(d, $x$'joined', sn.key is not null, 'animal', g.animal,$x$, $x$'joined', sn.key is not null, 'gv', (select to_jsonb(x.picks) from game.gel_vote x where x.key = u.key), 'animal', g.animal,$x$);
    d := replace(d, $x$'board', b,$x$, $x$'board', b, 'gelVote', game.gv_info(),$x$);
    if position('gel_vote' in d) = 0 or position('gelVote' in d) = 0 then raise exception 'export patch did not apply'; end if;
    execute d;
  end if;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
