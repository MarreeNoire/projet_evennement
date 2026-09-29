-- This function is only called by the trusted new-user trigger.
revoke all on function public.seed_notification_preferences(uuid) from public, anon, authenticated;
