-- Speed bonus goes only to the first correct answer in each round. Run after update_2.sql.
create or replace function game.g2_score(r int) returns table(key text, correct int, base int, bonus int, pts int) language sql stable as $$
  with st as (select (settings->>'fullPoints')::int fp, (settings->>'halfPoints')::int hp, (settings->>'bonusStart')::int bs from game.state where id = 1),
  c as (
    select s.key, s.seq, (select count(*)::int from jsonb_array_elements(rd.cards) e where s.map->>(e->>'a') = e->>'id') correct
    from game.g2_sub s join game.g2_round rd on rd.round = s.round where s.round = r),
  rk as (select c.*, case when correct = 4 then row_number() over (partition by correct = 4 order by seq) end rn from c),
  b as (select rk.key, rk.correct, case rk.correct when 4 then st.fp when 2 then st.hp else 0 end base,
      case when rn = 1 then st.bs else 0 end bonus from rk, st)
  select key, correct, base, bonus, base + bonus from b $$;

create or replace function game.g3_score(r int) returns table(key text, sign int, base int, bonus int, penalty int, pts int, wrong int) language sql stable as $$
  with st as (select (settings->>'bonusStart')::int bs, (settings->>'wrongPenalty')::int wp from game.state where id = 1),
  rk as (select a.*, case when correct_sign is not null then row_number() over (partition by correct_sign is not null order by a.seq) end rn from game.g3_ans a where a.round = r),
  b as (select rk.key, rk.correct_sign sign,
      case when rk.correct_sign is null then 0 else coalesce((rd.sign_points->>rk.correct_sign)::int, 0) end base,
      case when rn = 1 then st.bs else 0 end bonus,
      jsonb_array_length(rk.wrong) * st.wp penalty, jsonb_array_length(rk.wrong) wrong
    from rk join game.g3_round rd on rd.round = rk.round, st)
  select key, sign, base, bonus, penalty, base + bonus - penalty, wrong from b $$;

revoke all on function game.g2_score(int), game.g3_score(int) from public, anon, authenticated;
