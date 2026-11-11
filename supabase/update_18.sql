-- Game 2: the matching page gets a 2-minute timer (display only; nothing advances on its own). Run after update_17.sql.
do $do$ declare d text; begin
  d := pg_get_functiondef('game.set_phase(text,integer)'::regprocedure);
  if position('120 seconds' in d) = 0 then
    d := replace(d, $x$ends_at = case when p = 'g2_countdown' then now() + interval '10 seconds' end$x$, $x$ends_at = case when p = 'g2_countdown' then now() + interval '10 seconds' when p = 'g2_match' then now() + interval '120 seconds' end$x$);
    if position('120 seconds' in d) = 0 then raise exception 'set_phase patch did not apply'; end if;
    execute d;
  end if;
end $do$;
