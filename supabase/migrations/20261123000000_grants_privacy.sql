-- =====================================================================
-- API grants + profile privacy. Run AFTER 20261122000000_srs_mvp.sql.
-- Safe to re-run. Run this BEFORE deploying the matching app version:
-- the app reads public names from public.public_profiles.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES: public.users holds email / phone, so a row is readable only
--    by its owner and admins. Everyone else reads public_profiles.
-- ---------------------------------------------------------------------
drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users for select
  using (auth.uid() = id or public.is_admin());

-- Runs with the owner's rights on purpose: it exposes only these columns.
create or replace view public.public_profiles as
  select id, first_name, last_name, role, avatar_url, bio, degree, experience_years
    from public.users;

-- A one-table view is auto-updatable, and writes through it would skip RLS on
-- public.users. Reject them here even if someone grants write access later.
create or replace function public.reject_write()
returns trigger language plpgsql as $$
begin
  raise exception 'public_profiles is read-only' using errcode = '42501';
end;
$$;
drop trigger if exists public_profiles_readonly on public.public_profiles;
create trigger public_profiles_readonly instead of insert or update or delete on public.public_profiles
  for each row execute procedure public.reject_write();

-- Emails of the students of one course: its instructor or an admin only.
create or replace function public.course_student_emails(p_course int)
returns table (student_id uuid, email text)
language sql stable security definer set search_path = public as $$
  select u.id, u.email
    from public.enrollments e join public.users u on u.id = e.student_id
   where e.course_id = p_course and (public.owns_course(p_course) or public.is_admin());
$$;

-- ---------------------------------------------------------------------
-- 2. GRANTS: row access is decided by RLS; without these the API returns 401.
--    Add grants here when a later migration creates tables.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Exceptions (must stay after the blanket grants above).
revoke execute on function public.recalc_course_stats(int) from public, anon, authenticated;
revoke all on public.public_profiles, public.course_outline from anon, authenticated;
grant select on public.public_profiles, public.course_outline to anon, authenticated;

-- Let the API see the new view and function immediately.
notify pgrst, 'reload schema';
