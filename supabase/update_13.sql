-- Game 3 signs can be opened in any order. Points still follow how many signs are open. Run after update_12.sql.
alter table game.g3_round add column if not exists opened int[] not null default '{}';
update game.g3_round set opened = array(select generate_series(0, signs - 1)) where cardinality(opened) < signs;

-- opens sign i (0-based), or the first closed sign when i is null
create or replace function game.g3_open(i int) returns void language plpgsql security definer set search_path = game, public as $$
declare st game.state; rd game.g3_round; j int;
begin
  select * into st from game.state where id = 1;
  if st.phase <> 'g3_board' then return; end if;
  select * into rd from game.g3_round where round = st.round for update;
  if rd is null or rd.signs >= rd.sign_count then return; end if;
  j := coalesce(i, (select min(x) from generate_series(0, rd.sign_count - 1) x where not x = any(rd.opened)));
  if j is null or j < 0 or j >= rd.sign_count or j = any(rd.opened) then return; end if;
  update game.g3_round set opened = opened || j, signs = signs + 1, opened_at = coalesce(opened_at, now()) where round = st.round;
  perform game.bump();
end $$;

do $do$ declare d text; f text; begin
  for f in select unnest(array['game.advance()', 'game.do_admin(jsonb)', 'game.next_label(text,integer)', 'game.shared_view()']) loop
    begin d := pg_get_functiondef(f::regprocedure); exception when others then
      select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'game' and p.prokind = 'f' and p.proname = split_part(split_part(f, '.', 2), '(', 1) limit 1;
    end;
    if f like 'game.advance%' then
      if position('g3_open' in d) = 0 then
        d := replace(d, $x$update game.g3_round set signs = signs + 1, opened_at = coalesce(opened_at, now()) where round = st.round; perform game.bump();$x$, $x$perform game.g3_open(null);$x$);
        if position('g3_open' in d) = 0 then raise exception 'advance patch did not apply'; end if;
      end if;
    elsif f like 'game.do_admin%' then
      if position('openSign' in d) = 0 then
        d := replace(d, $x$  when 'next' then perform game.advance();$x$, $x$  when 'openSign' then perform game.g3_open((b->>'i')::int);
  when 'next' then perform game.advance();$x$);
        if position('openSign' in d) = 0 then raise exception 'do_admin patch did not apply'; end if;
      end if;
    elsif f like 'game.next_label%' then
      if position('opened' in d) = 0 then
        d := replace(d, $x$'เปิดป้ายที่ ' || (signs + 1)$x$, $x$'เปิดป้ายที่ ' || (select min(x) + 1 from generate_series(0, sign_count - 1) x where not x = any(opened))$x$);
        if position('opened' in d) = 0 then raise exception 'next_label patch did not apply'; end if;
      end if;
    else
      if position('rd.opened' in d) = 0 then
        d := replace(d, $x$case when i < shown then per->'clues'->i$x$, $x$case when st.phase <> 'g3_board' or i = any(rd.opened) then per->'clues'->i$x$);
        d := replace(d, $x$jsonb_build_object('signs', shown, $x$, $x$jsonb_build_object('signs', shown, 'opened', to_jsonb(coalesce(rd.opened, '{}')), $x$);
        if position('i = any(rd.opened)' in d) = 0 or position('''opened''' in d) = 0 then raise exception 'shared_view patch did not apply'; end if;
      end if;
    end if;
    execute d;
  end loop;
end $do$;
revoke all on function game.g3_open(int) from public;
