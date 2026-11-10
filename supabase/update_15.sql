-- Q4 2026 Update deck: Recap + GEL Reality Check before the vote (phase p0, 2 pages),
-- Repeat Visit, สรุป 3 เรื่อง and GEL Key Takeaway after the member pages (p3 now 6 pages),
-- and logging out removes the person from the joined list. Run after update_14.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  if position('''p0''' in d) = 0 then
    d := replace(d, $x$when 'lobby' then perform game.set_phase('gvote', 0);$x$, $x$when 'lobby' then perform game.set_phase('p0', 0);
    when 'p0' then
      if st.round < 1 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('gvote', 0); end if;$x$);
    d := replace(d, $x$when 'p3' then
      if st.round < 2 then$x$, $x$when 'p3' then
      if st.round < 5 then$x$);
    if position('''p0''' in d) = 0 or position('st.round < 5 then update game.state set round = round + 1 where id = 1; perform game.bump(); end if;' in d) = 0 then raise exception 'advance patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.next_label()'::regprocedure);
  if position('''p0''' in d) = 0 then
    d := replace(d, $x$when 'lobby' then 'GEL ที่ดีต้องมีพฤติกรรมอะไร? →'$x$, $x$when 'lobby' then 'Recap Q3 →' when 'p0' then case when r < 1 then 'GEL Reality Check →' else 'GEL ที่ดีต้องมีพฤติกรรมอะไร? →' end$x$);
    d := replace(d, $x$when 'p3' then case when r < 2 then 'สไลด์ถัดไป →' else null end$x$, $x$when 'p3' then case when r < 5 then 'สไลด์ถัดไป →' else null end$x$);
    if position('''p0''' in d) = 0 or position('r < 5' in d) = 0 then raise exception 'label patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  if position('''p0''' in d) = 0 then
    d := replace(d, $x$array['lobby','gvote',$x$, $x$array['lobby','p0','gvote',$x$);
    if position('''p0''' in d) = 0 then raise exception 'goto patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.do_act(text,jsonb)'::regprocedure);
  if position('''p0''' in d) = 0 then
    d := replace(d, $x$if st.phase in ('idle','lobby','gvote',$x$, $x$if st.phase in ('idle','lobby','p0','gvote',$x$);
    if position('''p0''' in d) = 0 then raise exception 'act patch did not apply'; end if;
    execute d;
  end if;
end $do$;

-- logging out ends this device's session; the person leaves the joined list unless still signed in elsewhere
create or replace function public.mm_logout(p_token uuid) returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare k text;
begin
  delete from game.sessions where token = p_token returning key into k;
  if k is not null and not exists(select 1 from game.sessions where key = k) then
    delete from game.seen where key = k;
    perform game.bump_admin();
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on all functions in schema game from public, anon, authenticated;
