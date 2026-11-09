-- Deck pages between games: Part 2 (slides 47-54) after the GEL recap, member data (slides 71-73) after the final results. Run after update_8.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  d := replace(d, $x$if st.round < 5 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('g3_intro', 0); end if;$x$, $x$if st.round < 5 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('p2', 0); end if;
    when 'p2' then
      if st.round < 7 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('g3_intro', 0); end if;$x$);
  d := replace(d, $x$else perform game.set_phase('final', 0); end if;$x$, $x$else perform game.set_phase('final', 0); end if;
    when 'final' then perform game.set_phase('p3', 0);
    when 'p3' then
      if st.round < 2 then update game.state set round = round + 1 where id = 1; perform game.bump(); end if;$x$);
  if position('''p2''' in d) = 0 or position('''p3''' in d) = 0 then raise exception 'advance patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.next_label()'::regprocedure);
  d := replace(d, $x$when 4 then '5 เรื่องที่ GEL ต้องทำ →' else 'ไปเกมที่ 3 →' end$x$, $x$when 4 then '5 เรื่องที่ GEL ต้องทำ →' else 'Part 2 รู้จักลูกค้า →' end
    when 'p2' then case when r < 7 then 'สไลด์ถัดไป →' else 'ไปเกมที่ 3 →' end
    when 'final' then 'ข้อมูลสมาชิก →'
    when 'p3' then case when r < 2 then 'สไลด์ถัดไป →' else null end$x$);
  if position('''p2''' in d) = 0 then raise exception 'label patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  d := replace(d, $x$'g2_end','gel',$x$, $x$'g2_end','gel','p2',$x$);
  d := replace(d, $x$'g3_board','final'$x$, $x$'g3_board','final','p3'$x$);
  if position($x$'p2'$x$ in d) = 0 or position($x$'p3'$x$ in d) = 0 then raise exception 'goto patch did not apply'; end if;
  execute d;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
