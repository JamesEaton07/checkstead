-- Backfill landlords rows for any auth.users created before the
-- on_auth_user_created trigger (0001_init.sql) existed on this project.
-- Safe to re-run: only inserts users missing a landlords row.

insert into public.landlords (id, email)
select u.id, u.email
from auth.users u
left join public.landlords l on l.id = u.id
where l.id is null
on conflict (id) do nothing;
