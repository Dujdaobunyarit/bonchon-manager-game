-- Adds the page explaining the 4 animals between game 1 and the groups. Round holds how many are open. Run after update_5.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.advance()'::regprocedure);
  d := replace(d, $x$when 'g1_end' then perform game.set_phase('groups', 0);$x$, $x$when 'g1_end' then perform game.set_phase('learn', 0);
    when 'learn' then
      if st.round < 4 then update game.state set round = round + 1 where id = 1; perform game.bump();
      else perform game.set_phase('groups', 0); end if;$x$);
  if position('''learn''' in d) = 0 then raise exception 'advance patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.next_label()'::regprocedure);
  d := replace(d, $x$when 'g1_end' then 'ดูการแบ่งกลุ่ม →'$x$, $x$when 'g1_end' then 'สั่งงานให้ตรงประเภท →'
    when 'learn' then case r when 0 then '🐂 เปิดกระทิง' when 1 then '🦅 เปิดอินทรี' when 2 then '🐭 เปิดหนู' when 3 then '🐻 เปิดหมี' else 'ดูการแบ่งกลุ่ม →' end$x$);
  if position('เปิดกระทิง' in d) = 0 then raise exception 'label patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  d := replace(d, $x$array['lobby','g1','g1_end','groups',$x$, $x$array['lobby','g1','g1_end','learn','groups',$x$);
  if position('''learn''' in d) = 0 then raise exception 'goto patch did not apply'; end if;
  execute d;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
