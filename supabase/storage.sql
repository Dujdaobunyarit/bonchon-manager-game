-- Public bucket for the 10 scenario motions: s1.mp4 ... s10.mp4. Run once after schema.sql.
insert into storage.buckets(id, name, public) values ('motions', 'motions', true) on conflict (id) do nothing;
-- Deck pages shown between games: p47.jpg ... Images only, 5 MB each.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values ('slides', 'slides', true, 5242880, array['image/jpeg']) on conflict (id) do nothing;
