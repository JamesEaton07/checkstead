-- Security fix: `revoke execute ... from anon, authenticated` (used in
-- 0009, 0010, and 0012) does not actually block those roles. Postgres
-- grants EXECUTE to PUBLIC by default when a function is created, and
-- both anon and authenticated are implicitly members of PUBLIC — so the
-- prior revokes had no real effect; has_function_privilege('anon', ...)
-- for these functions returned true in production.
--
-- The trigger-only functions (handle_new_user, set_updated_at,
-- create_baseline_checkin) return `trigger` and Postgres refuses to
-- invoke them outside trigger context regardless of grants, so this was
-- not directly exploitable for those three. resolve_tenant_baseline_checkin
-- is a normal function, though, and WAS directly callable via RPC with
-- any token — leaking tenant_id (a field its public wrapper,
-- get_tenant_baseline_checkin, deliberately omits). Revoking from PUBLIC
-- is the fix; it does not break the internal callers below, because a
-- call from inside a SECURITY DEFINER function executes as the function
-- owner, which always retains execute rights on functions it owns.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.create_baseline_checkin() from public;
revoke execute on function public.resolve_tenant_baseline_checkin(text) from public;
