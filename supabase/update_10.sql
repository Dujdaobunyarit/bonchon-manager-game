-- Game 3 defaults to five signs worth 100, 80, 60, 40, 20. Run after update_9.sql.
alter table game.state alter column settings set default '{"fullPoints":100,"halfPoints":50,"onePoints":25,"bonusStart":15,"signCount":5,"signPoints":[100,80,60,40,20],"wrongPenalty":0}';
update game.state set settings = settings || '{"signCount":5,"signPoints":[100,80,60,40,20]}'::jsonb where id = 1 and settings->'signPoints' = '[100,75,50,25]'::jsonb;
