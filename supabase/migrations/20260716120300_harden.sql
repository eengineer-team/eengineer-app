-- ============================================================================
-- eengineer — hardening (clears Supabase security advisors after apply).
-- 1. Pin search_path on the SECURITY INVOKER claim-readers (0011 linter).
-- 2. Revoke API execute on the pre-existing rls_auto_enable() event-trigger
--    function so anon/authenticated can't call it via RPC (0028/0029 linter).
--    (It still fires as an event trigger on CREATE TABLE regardless.)
-- ============================================================================
alter function app.status()          set search_path = '';
alter function app.role()            set search_path = '';
alter function app.is_verified()     set search_path = '';
alter function app.is_builder()      set search_path = '';
alter function app.is_preview()      set search_path = '';
alter function app.has_role(text[])  set search_path = '';

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
