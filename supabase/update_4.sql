-- Equal totals are ranked by the total time taken on scoring answers. Run after update_3.sql.
alter table game.g2_round add column if not exists opened_at timestamptz;
alter table game.g3_round add column if not exists opened_at timestamptz;

create or replace function game.set_phase(p text, r int) returns void language plpgsql as $$
begin
  update game.state set phase = p, round = r, board = false, recap_tab = 'answer',
    ends_at = case when p = 'g2_countdown' then now() + interval '10 seconds' end where id = 1;
  if p in ('g2_motion','g2_countdown','g2_match','g2_reveal','g2_scores') then perform game.g2_ensure(r); end if;
  if p = 'g2_match' then update game.g2_round set opened_at = coalesce(opened_at, now()) where round = r; end if;
  if p = 'g3_board' then perform game.g3_ensure(r); end if;
  perform game.bump();
end $$;

do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  d := replace(d, $x$update game.g3_round set signs = signs + 1 where round = st.round;$x$, $x$update game.g3_round set signs = signs + 1, opened_at = coalesce(opened_at, now()) where round = st.round;$x$);
  if position('opened_at' in d) = 0 then raise exception 'advance patch did not apply'; end if;
  execute d;
end $do$;

create or replace function game.scoreboard() returns jsonb language sql stable as $$
  with st as (select phase, round from game.state where id = 1),
  g2 as (select s.key, sum(s.pts)::int t from generate_series(0, game.g2n() - 1) i, lateral game.g2_score(i) s group by 1),
  g3 as (select s.key, sum(s.pts)::int t from generate_series(0, game.g3n() - 1) i, lateral game.g3_score(i) s group by 1),
  cur as (
    select s.key, s.pts from st, lateral game.g2_score(st.round) s where st.phase like 'g2%'
    union all select s.key, s.pts from st, lateral game.g3_score(st.round) s where st.phase like 'g3%'),
  spent as (
    select x.key, sum(x.ms)::bigint ms from (
      select sb.key, greatest(0, extract(epoch from sb.at - rd.opened_at) * 1000) ms
        from generate_series(0, game.g2n() - 1) i cross join lateral game.g2_score(i) s
        join game.g2_sub sb on sb.round = i and sb.key = s.key join game.g2_round rd on rd.round = i
        where s.pts > 0 and rd.opened_at is not null
      union all
      select a.key, greatest(0, extract(epoch from a.at - rd.opened_at) * 1000) ms
        from generate_series(0, game.g3n() - 1) i cross join lateral game.g3_score(i) s
        join game.g3_ans a on a.round = i and a.key = s.key join game.g3_round rd on rd.round = i
        where s.base > 0 and rd.opened_at is not null
    ) x group by 1),
  t as (select u.id, u.name, u.group_no, gr.nick, coalesce(g2.t, 0) g2, coalesce(g3.t, 0) g3, coalesce(g2.t, 0) + coalesce(g3.t, 0) total, coalesce(cur.pts, 0) last, coalesce(sp.ms, 0) ms
    from game.roster u left join game.groups gr on gr.no = u.group_no left join g2 on g2.key = u.key left join g3 on g3.key = u.key left join cur on cur.key = u.key left join spent sp on sp.key = u.key where u.level = 'L4'),
  r as (select t.*, rank() over (order by total desc, ms) rnk from t)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'group', group_no, 'nick', nick, 'g2', g2, 'g3', g3, 'total', total, 'last', last, 'ms', ms, 'rank', rnk) order by total desc, ms, group_no), '[]') from r $$;

-- back office computes the board once per refresh, not once per coach
do $do$ declare d text; begin
  d := pg_get_functiondef('public.mm_monitor(uuid)'::regprocedure);
  d := replace(d, 'declare st game.state; total int;', 'declare st game.state; b jsonb := game.scoreboard();');
  d := replace(d, 'jsonb_array_elements(game.scoreboard()) e', 'jsonb_array_elements(b) e');
  if position('b jsonb' in d) = 0 then raise exception 'monitor patch did not apply'; end if;
  execute d;
end $do$;

revoke all on all functions in schema game from public, anon, authenticated;
