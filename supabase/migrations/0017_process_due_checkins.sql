-- Called once per cron run (see src/app/api/cron/check-in-reminders) via
-- the service role client — never by anon/authenticated, so this is
-- revoked from PUBLIC entirely rather than given any grant.
--
-- A tenant is "due" when: access is on, lease is active, the landlord
-- has opted into recurring check-ins, they don't already have a pending
-- regular check-in outstanding (this is what makes the function
-- idempotent — a tenant who hasn't submitted stays "not due again"
-- until they do, so a daily cron run never creates duplicates or
-- re-notifies for the same cycle), and enough days have passed since
-- their most recently submitted check-in (baseline or regular).
--
-- For each due tenant this creates their new regular check-in row and
-- returns everything the caller needs to send both reminder emails,
-- including their most recent active access-grant token (nullable —
-- if they have none, the caller can still email the landlord and skip
-- the tenant email rather than send a broken link).
create or replace function public.process_due_checkins()
returns table (
  tenant_id uuid,
  tenant_name text,
  tenant_contact text,
  property_address text,
  property_unit_info text,
  access_token text,
  landlord_email text,
  landlord_notify_email boolean,
  landlord_notify_sms boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select
      t.id as tid,
      t.property_id as pid,
      t.name,
      t.contact,
      p.address,
      p.unit_info,
      l.email,
      l.notify_email,
      l.notify_sms,
      (
        select ag.token
        from public.access_grants ag
        where ag.tenant_id = t.id and ag.active = true
        order by ag.created_at desc
        limit 1
      ) as token
    from public.tenants t
    join public.properties p on p.id = t.property_id
    join public.landlords l on l.id = p.landlord_id
    where t.tenant_access_enabled = true
      and t.lease_status = 'active'
      and l.checkin_frequency_days is not null
      and not exists (
        select 1 from public.checkins c
        where c.tenant_id = t.id and c.checkin_type = 'regular' and c.status = 'pending'
      )
      and exists (
        select 1 from public.checkins c
        where c.tenant_id = t.id and c.status = 'submitted'
      )
      and (
        select max(c.submitted_at) from public.checkins c
        where c.tenant_id = t.id and c.status = 'submitted'
      ) + (l.checkin_frequency_days || ' days')::interval <= now()
  loop
    insert into public.checkins (property_id, tenant_id, checkin_type, status)
    values (rec.pid, rec.tid, 'regular', 'pending');

    tenant_id := rec.tid;
    tenant_name := rec.name;
    tenant_contact := rec.contact;
    property_address := rec.address;
    property_unit_info := rec.unit_info;
    access_token := rec.token;
    landlord_email := rec.email;
    landlord_notify_email := rec.notify_email;
    landlord_notify_sms := rec.notify_sms;
    return next;
  end loop;
end;
$$;

revoke execute on function public.process_due_checkins() from public;
