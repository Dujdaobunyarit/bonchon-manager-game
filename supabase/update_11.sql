-- Game 3 rounds can be extra characters that stand for one of the 7 personas ("as": persona id).
-- Choices list only the 7 personas, and the right answer for an extra character is its persona. Run after update_10.sql.
do $do$ declare f record; d text; o text; n int := 0; begin
  for f in select p.oid from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'game' and p.prokind = 'f' and pg_get_functiondef(p.oid) like '%cfg(''personas'')%' loop
    d := pg_get_functiondef(f.oid); o := d;
    d := replace(d, $x$jsonb_build_object('id', e->>'id', 'name', e->>'name', 'img', e->>'img') order by o) from jsonb_array_elements(game.cfg('personas')) with ordinality t(e, o))$x$,
      $x$jsonb_build_object('id', e->>'id', 'name', e->>'name', 'img', e->>'img') order by o) from jsonb_array_elements(game.cfg('personas')) with ordinality t(e, o) where e->>'as' is null)$x$);
    d := replace(d, $x$if not exists(select 1 from jsonb_array_elements(game.cfg('personas')) e where e->>'id' = b->>'choice')$x$,
      $x$if not exists(select 1 from jsonb_array_elements(game.cfg('personas')) e where e->>'id' = b->>'choice' and e->>'as' is null)$x$);
    d := replace(d, $x$correct_id := game.cfg('personas')->st.round->>'id';$x$, $x$correct_id := coalesce(game.cfg('personas')->st.round->>'as', game.cfg('personas')->st.round->>'id');$x$);
    if d <> o then execute d; n := n + 1; end if;
  end loop;
  if n = 0 then raise exception 'no function patched'; end if;
end $do$;
revoke all on all functions in schema game from public, anon, authenticated;
