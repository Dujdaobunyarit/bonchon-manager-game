-- One right pair scores 25. Adds the GEL recap after game 2: four animals, then the five actions. Run after update_7.sql.
update game.state set settings = settings || '{"onePoints":25}'::jsonb where id = 1 and not settings ? 'onePoints';
alter table game.state alter column settings set default '{"fullPoints":100,"halfPoints":50,"onePoints":25,"bonusStart":15,"signCount":4,"signPoints":[100,75,50,25],"wrongPenalty":0}';
create or replace function game.g2_score(r int) returns table(key text, correct int, base int, bonus int, pts int) language sql stable as $$
  with st as (select (settings->>'fullPoints')::int fp, (settings->>'halfPoints')::int hp, coalesce((settings->>'onePoints')::int, 25) op, (settings->>'bonusStart')::int bs from game.state where id = 1),
  c as (
    select s.key, s.seq, (select count(*)::int from jsonb_array_elements(rd.cards) e where s.map->>(e->>'a') = e->>'id') correct
    from game.g2_sub s join game.g2_round rd on rd.round = s.round where s.round = r),
  rk as (select c.*, case when correct = 4 then row_number() over (partition by correct = 4 order by seq) end rn from c),
  b as (select rk.key, rk.correct, case rk.correct when 4 then st.fp when 2 then st.hp when 1 then st.op else 0 end base,
      case when rn = 1 then st.bs else 0 end bonus from rk, st)
  select key, correct, base, bonus, base + bonus from b $$;
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  d := replace(d, $x$when 'g2_end' then perform game.set_phase('g3_intro', 0);$x$, $x$when 'g2_end' then perform game.set_phase('gel', 0);
    when 'gel' then
      if st.round < 5 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('g3_intro', 0); end if;$x$);
  if position('''gel''' in d) = 0 then raise exception 'advance patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.next_label()'::regprocedure);
  d := replace(d, $x$when 'g2_end' then 'ไปเกมที่ 3 →'$x$, $x$when 'g2_end' then 'สรุปกิจกรรมที่ 1 →'
    when 'gel' then case r when 0 then '🐂 เปิดกระทิง' when 1 then '🦅 เปิดอินทรี' when 2 then '🐭 เปิดหนู' when 3 then '🐻 เปิดหมี' when 4 then '5 เรื่องที่ GEL ต้องทำ →' else 'ไปเกมที่ 3 →' end$x$);
  if position('''gel''' in d) = 0 then raise exception 'label patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  d := replace(d, $x$'g2_motion','g2_end',$x$, $x$'g2_motion','g2_end','gel',$x$);
  if position($x$'gel'$x$ in d) = 0 then raise exception 'goto patch did not apply'; end if;
  d := replace(d, $x$'halfPoints', game.num(s->'halfPoints', (t->>'halfPoints')::int, 0, 1000),$x$, $x$'halfPoints', game.num(s->'halfPoints', (t->>'halfPoints')::int, 0, 1000), 'onePoints', game.num(s->'onePoints', coalesce((t->>'onePoints')::int, 25), 0, 1000),$x$);
  if position('onePoints' in d) = 0 then raise exception 'settings patch did not apply'; end if;
  execute d;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
