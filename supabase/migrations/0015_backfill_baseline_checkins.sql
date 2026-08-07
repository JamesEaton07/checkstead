-- The on_tenant_created trigger (0010) only fires on INSERT, so any
-- tenant created before that migration was pushed has no baseline
-- checkin row at all — their tenant access page silently falls back to
-- the "not built yet" placeholder instead of the photo checklist.
-- Backfill one baseline checkin for every existing tenant that's
-- missing one, same pattern as the landlord backfill in 0003.
insert into public.checkins (property_id, tenant_id, checkin_type, status)
select t.property_id, t.id, 'baseline', 'pending'
from public.tenants t
where not exists (
  select 1 from public.checkins c
  where c.tenant_id = t.id and c.checkin_type = 'baseline'
);
