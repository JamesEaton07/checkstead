-- Private storage bucket for check-in photos. Objects are stored at
-- "<checkin_id>/<category>-<random>.<ext>" — storage.foldername() below
-- reads the checkin_id back out of that path to scope access.
--
-- Only a landlord SELECT policy exists here. Uploads never go through
-- RLS at all: tenants have no Supabase Auth session, so the upload path
-- is a server action using the service role key (bypasses RLS by design,
-- after the server independently validates the tenant's access-grant
-- token — see src/lib/actions/checkin-photos.ts). There is deliberately
-- no INSERT/UPDATE/DELETE policy for the authenticated role.
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

create policy "checkin_photos_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'checkin-photos'
    and exists (
      select 1 from public.checkins c
      join public.properties p on p.id = c.property_id
      where c.id::text = (storage.foldername(name))[1]
        and p.landlord_id = auth.uid()
    )
  );
