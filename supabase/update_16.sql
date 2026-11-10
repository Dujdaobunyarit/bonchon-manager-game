-- Final results move to the very end: persona summary → member pages (p3, 6 pages) → final. Run after update_15.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  if position($x$when 'pmap' then perform game.set_phase('p3', 0);$x$ in d) = 0 then
    d := replace(d, $x$when 'pmap' then perform game.set_phase('final', 0);
    when 'final' then perform game.set_phase('p3', 0);
    when 'p3' then
      if st.round < 5 then update game.state set round = round + 1 where id = 1; perform game.bump(); end if;$x$, $x$when 'pmap' then perform game.set_phase('p3', 0);
    when 'p3' then
      if st.round < 5 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('final', 0); end if;$x$);
    if position($x$when 'pmap' then perform game.set_phase('p3', 0);$x$ in d) = 0 then raise exception 'advance patch did not apply'; end if;
    execute d;
  end if;

  d := pg_get_functiondef('game.next_label()'::regprocedure);
  if position($x$when 'pmap' then 'ข้อมูลสมาชิก →'$x$ in d) = 0 then
    d := replace(d, $x$when 'final' then 'ข้อมูลสมาชิก →'$x$, $x$when 'final' then null$x$);
    d := replace(d, $x$when 'p3' then case when r < 5 then 'สไลด์ถัดไป →' else null end$x$, $x$when 'p3' then case when r < 5 then 'สไลด์ถัดไป →' else '🏆 สรุปผล' end$x$);
    d := replace(d, $x$when 'pmap' then '🏆 สรุปผล'$x$, $x$when 'pmap' then 'ข้อมูลสมาชิก →'$x$);
    if position($x$when 'pmap' then 'ข้อมูลสมาชิก →'$x$ in d) = 0 or position($x$else '🏆 สรุปผล' end$x$ in d) = 0 then raise exception 'label patch did not apply'; end if;
    execute d;
  end if;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
