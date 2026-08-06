-- Step 3 (spec build order): photo checklist, upload, baseline capture.
--
-- checkin_photos holds one row per uploaded photo, tagged to a checklist
-- category, against a specific checkin. A checkin's overall status/submitted_at
-- already lives on public.checkins (0002); this table is just its photos.
create table if not exists public.checkin_photos (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  category text not null check (
    category in ('kitchen', 'bathroom', 'living_room', 'bedroom', 'exterior', 'other')
  ),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists checkin_photos_checkin_id_idx on public.checkin_photos (checkin_id);

alter table public.checkin_photos enable row level security;

-- Landlord-only visibility for now (viewing, in the dashboard). Tenants
-- have no Supabase Auth session at all, so their uploads go through a
-- security-definer RPC (see 0011), not RLS — this policy governs the
-- landlord side only.
create policy "checkin_photos_select_own" on public.checkin_photos
  for select using (
    exists (
      select 1 from public.checkins c
      join public.properties p on p.id = c.property_id
      where c.id = checkin_photos.checkin_id and p.landlord_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Every new tenancy gets its own fresh move-in baseline checkin — never
-- inherited from a previous tenant (spec, feature 3). Enforced structurally:
-- a baseline checkin row is created automatically the moment a tenant row
-- is created, tied 1:1 to that specific tenant.
-- ---------------------------------------------------------------------------
create or replace function public.create_baseline_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.checkins (property_id, tenant_id, checkin_type, status)
  values (new.property_id, new.id, 'baseline', 'pending');
  return new;
end;
$$;

drop trigger if exists on_tenant_created on public.tenants;
create trigger on_tenant_created
  after insert on public.tenants
  for each row execute function public.create_baseline_checkin();

revoke execute on function public.create_baseline_checkin() from anon, authenticated;
