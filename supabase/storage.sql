-- Public bucket for the 10 scenario motions: s1.mp4 ... s10.mp4. Run once after schema.sql.
insert into storage.buckets(id, name, public) values ('motions', 'motions', true) on conflict (id) do nothing;
