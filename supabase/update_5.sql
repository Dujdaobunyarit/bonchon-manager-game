-- Devices that stay open across a reset rejoin the game on their next refresh. Run after update_4.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('public.mm_view(uuid)'::regprocedure);
  d := replace(d, $x$  v := v || jsonb_build_object('me', game.player_me(ses.key, v));$x$, $x$  if not exists(select 1 from game.seen s where s.key = ses.key) then
    insert into game.seen(key) values (ses.key) on conflict do nothing;
    perform game.bump_admin();
  end if;
  v := v || jsonb_build_object('me', game.player_me(ses.key, v));$x$);
  if position('game.seen' in d) = 0 then raise exception 'mm_view patch did not apply'; end if;
  execute d;
end $do$;
