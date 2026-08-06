-- Extends the tenant access-grant mechanism (0006) to support a revoked
-- link showing a clear "access turned off" message instead of a generic
-- "not found", plus a way for the tenant to notify their landlord they
-- want access restored.

-- ---------------------------------------------------------------------------
-- get_tenant_access: now returns revoked grants too (with active = false),
-- instead of only active ones. The caller decides what to show; we still
-- return nothing at all for a token that was never real, since there's no
-- tenant/landlord to reference in that case.
-- ---------------------------------------------------------------------------
drop function if exists public.get_tenant_access(text);

create function public.get_tenant_access(p_token text)
returns table (
  tenant_id uuid,
  tenant_name text,
  lease_status text,
  property_id uuid,
  property_address text,
  property_unit_info text,
  active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      t.id as tenant_id,
      t.name as tenant_name,
      t.lease_status,
      p.id as property_id,
      p.address as property_address,
      p.unit_info as property_unit_info,
      ag.active
    from public.access_grants ag
    join public.tenants t on t.id = ag.tenant_id
    join public.properties p on p.id = t.property_id
    where ag.token = p_token;
end;
$$;

grant execute on function public.get_tenant_access(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- request_tenant_access: called when a tenant clicks "Request access" on a
-- revoked grant's page. Looks up who to notify and how (without ever
-- exposing the landlord's email to the caller — this runs behind a Next.js
-- server action, never called directly from the browser), and rate-limits
-- via the same try_consume_email_send counter used for magic-link sends
-- (0005), namespaced separately so it can't be exhausted by login traffic
-- or vice versa, and keyed per tenant so one stale link can't be spammed
-- while a different tenant's genuine request still goes through.
-- ---------------------------------------------------------------------------
create function public.request_tenant_access(p_token text)
returns table (
  tenant_name text,
  property_address text,
  landlord_email text,
  landlord_notify_email boolean,
  landlord_notify_sms boolean,
  allowed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_tenant_name text;
  v_property_address text;
  v_landlord_email text;
  v_notify_email boolean;
  v_notify_sms boolean;
  v_allowed boolean;
begin
  select t.id, t.name, p.address, l.email, l.notify_email, l.notify_sms
  into v_tenant_id, v_tenant_name, v_property_address, v_landlord_email, v_notify_email, v_notify_sms
  from public.access_grants ag
  join public.tenants t on t.id = ag.tenant_id
  join public.properties p on p.id = t.property_id
  join public.landlords l on l.id = p.landlord_id
  where ag.token = p_token;

  if v_tenant_id is null then
    return;
  end if;

  select public.try_consume_email_send('tenant-access-request:' || v_tenant_id::text, 3, 3600)
  into v_allowed;

  return query select v_tenant_name, v_property_address, v_landlord_email, v_notify_email, v_notify_sms, v_allowed;
end;
$$;

grant execute on function public.request_tenant_access(text) to anon, authenticated;
