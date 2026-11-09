-- Customer persona summary page between the last game 3 scoreboard and the final results. Run after update_11.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  d := replace(d, $x$else perform game.set_phase('final', 0); end if;$x$, $x$else perform game.set_phase('pmap', 0); end if;
    when 'pmap' then perform game.set_phase('final', 0);$x$);
  if position('''pmap''' in d) = 0 then raise exception 'advance patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.next_label()'::regprocedure);
  d := replace(d, $x$else '🏆 สรุปผล' end$x$, $x$else '📋 สรุป Customer Persona →' end
    when 'pmap' then '🏆 สรุปผล'$x$);
  if position('''pmap''' in d) = 0 then raise exception 'label patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  d := replace(d, $x$'g3_board','final','p3'$x$, $x$'g3_board','pmap','final','p3'$x$);
  if position('''pmap''' in d) = 0 then raise exception 'goto patch did not apply'; end if;
  execute d;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
