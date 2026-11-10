-- After the final results: Master Service (4 pages) and a Break page (phase p4, rounds 0-4). Run after update_16.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  if position('''p4''' in d) = 0 then
    d := replace(d, $x$      else perform game.set_phase('final', 0); end if;$x$, $x$      else perform game.set_phase('final', 0); end if;
    when 'final' then perform game.set_phase('p4', 0);
    when 'p4' then
      if st.round < 4 then update game.state set round = round + 1 where id = 1; perform game.bump(); end if;$x$);
    if position('''p4''' in d) = 0 then raise exception 'advance patch did not apply'; end if;
    execute d;
  end if;
  d := pg_get_functiondef('game.next_label()'::regprocedure);
  if position('''p4''' in d) = 0 then
    d := replace(d, $x$when 'final' then null$x$, $x$when 'final' then 'Master Service →' when 'p4' then case when r < 3 then 'สไลด์ถัดไป →' when r = 3 then '☕ Break →' else null end$x$);
    if position('''p4''' in d) = 0 then raise exception 'label patch did not apply'; end if;
    execute d;
  end if;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  if position('''p4''' in d) = 0 then
    d := replace(d, $x$'final','p3']$x$, $x$'final','p3','p4']$x$);
    if position('''p4''' in d) = 0 then raise exception 'goto patch did not apply'; end if;
    execute d;
  end if;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
