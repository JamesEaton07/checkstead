-- Postgres grants EXECUTE to PUBLIC by default when a function is created,
-- which means handle_new_user() and set_updated_at() — internal helpers
-- only ever meant to run automatically as triggers — were technically
-- exposed as callable RPC endpoints via PostgREST for anon/authenticated
-- callers. Harmless today (both reference `new`, which only exists when
-- Postgres invokes them as a trigger, so a direct call just errors out),
-- but there's no reason to leave that door open. Trigger invocation isn't
-- subject to the caller's EXECUTE grant on the function, so the triggers
-- themselves (set_updated_at on every table that has one, and
-- on_auth_user_created) keep firing exactly as before.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
