-- Game 2 answers open one animal at a time, first the right style then the wrong style. Run after update_6.sql.
alter table game.state add column if not exists recap_open int not null default 0;
do $do$ declare d text; begin
  d := pg_get_functiondef('game.set_phase(text,int)'::regprocedure);
  d := replace(d, $x$recap_tab = 'answer',$x$, $x$recap_tab = 'answer', recap_open = 0,$x$);
  if position('recap_open' in d) = 0 then raise exception 'set_phase patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.advance()'::regprocedure);
  d := replace(d, $x$if st.recap_tab = 'answer' then update game.state set recap_tab = 'wrong' where id = 1; perform game.bump();$x$,
    $x$if st.recap_open < 4 then update game.state set recap_open = recap_open + 1 where id = 1; perform game.bump();
      elsif st.recap_tab = 'answer' then update game.state set recap_tab = 'wrong', recap_open = 0 where id = 1; perform game.bump();$x$);
  if position('recap_open' in d) = 0 then raise exception 'advance patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.next_label()'::regprocedure);
  d := replace(d, $x$when 'g2_reveal' then case when st.recap_tab = 'answer' then$x$,
    $x$when 'g2_reveal' then case when st.recap_open < 4 then (array['🐂 เปิดกระทิง','🦅 เปิดอินทรี','🐭 เปิดหนู','🐻 เปิดหมี'])[st.recap_open + 1] when st.recap_tab = 'answer' then$x$);
  if position('recap_open' in d) = 0 then raise exception 'label patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.shared_view()'::regprocedure);
  d := replace(d, $x$'recapTab', st.recap_tab,$x$, $x$'recapTab', st.recap_tab, 'recapOpen', st.recap_open,$x$);
  if position('recapOpen' in d) = 0 then raise exception 'view patch did not apply'; end if;
  execute d;
  d := pg_get_functiondef('game.do_admin(jsonb)'::regprocedure);
  d := replace(d, $x$else 'answer' end where id = 1; perform game.bump();$x$,
    $x$else 'answer' end, recap_open = 0 where id = 1; perform game.bump();
  when 'recapOpenAll' then update game.state set recap_open = 4 where id = 1; perform game.bump();$x$);
  d := replace(d, $x$recap_tab = 'answer', ends_at = null$x$, $x$recap_tab = 'answer', recap_open = 0, ends_at = null$x$);
  if position('recapOpenAll' in d) = 0 then raise exception 'admin patch did not apply'; end if;
  execute d;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
