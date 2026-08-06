-- list_checkin_photos (0012) was not gated by the active flag, so a
-- paused tenant (tenant_access_enabled = false) could still list their
-- own photo paths via direct RPC even though the access-grant toggle is
-- meant to fully block the tenant's link (see 0008). Not a data leak in
-- itself — only their own photo categories/paths, no image bytes — but
-- it doesn't match the "toggle off = fully blocked" model, so tighten it.
create or replace function public.list_checkin_photos(p_token text)
returns table (category text, storage_path text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin_id uuid;
  v_active boolean;
begin
  select r.checkin_id, r.active into v_checkin_id, v_active
  from public.resolve_tenant_baseline_checkin(p_token) r;

  if v_checkin_id is null or not v_active then
    return;
  end if;

  return query
    select cp.category, cp.storage_path, cp.created_at
    from public.checkin_photos cp
    where cp.checkin_id = v_checkin_id
    order by cp.created_at asc;
end;
$$;
