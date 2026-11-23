-- =====================================================================
-- VIAN Academy LMS — SRS v2.0 (Supabase MVP) migration
--
-- Run AFTER supabase_schema.sql (Supabase SQL Editor, or `supabase db push`).
-- Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE,
-- and every policy is dropped before it is recreated.
--
-- Contents
--   0. Helper functions (is_admin, owns_course, can_access_course, ...)
--   1. Security fixes on users (no self-promotion to admin, protected columns)
--   2. New columns on existing tables
--   3. New tables: certificates, coupons, app_settings, support_tickets
--   4. Row Level Security policies (rewritten for every table)
--   5. Triggers: course guards, counters, progress -> certificate
--   6. RPCs: quote_checkout, checkout, refund_transaction, mark_solution,
--            increment_topic_view, instructor_stats, admin_stats
--   7. View: course_outline (public curriculum without video URLs)
--   8. Storage buckets: avatars, thumbnails
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. HELPER FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and status = 'active');
$$;

create or replace function public.is_approved_instructor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and status = 'active'
      and (role = 'admin' or (role = 'instructor' and admin_approved))
  );
$$;

create or replace function public.owns_course(p_course int)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where course_id = p_course and instructor_id = auth.uid());
$$;

-- Published course, or the viewer is its instructor / an admin.
create or replace function public.course_visible(p_course int)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.courses c
    where c.course_id = p_course
      and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())
  );
$$;

-- Full content access: enrolled (active/completed), instructor of the course, or admin.
create or replace function public.can_access_course(p_course int)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or public.owns_course(p_course)
      or exists (
        select 1 from public.enrollments e
        where e.course_id = p_course and e.student_id = auth.uid() and e.status in ('active', 'completed')
      );
$$;

create or replace function public.lesson_course_id(p_lesson int)
returns int language sql stable security definer set search_path = public as $$
  select m.course_id from public.lessons l join public.modules m on m.module_id = l.module_id where l.lesson_id = p_lesson;
$$;

-- ---------------------------------------------------------------------
-- 1. SECURITY FIXES ON USERS
-- ---------------------------------------------------------------------
-- 1a. Signup: the client sends raw_user_meta_data, so never trust its role.
--     Only 'student' or 'instructor' can be chosen; admins are promoted via SQL.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := case when new.raw_user_meta_data->>'role' = 'instructor' then 'instructor' else 'student' end;
begin
  insert into public.users (id, email, first_name, last_name, role, avatar_url, degree, experience_years, admin_approved)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    v_role,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'degree',
    nullif(new.raw_user_meta_data->>'experience_years', '')::integer,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 1b. Users may edit their own profile, but not role / status / approval / email.
create or replace function public.users_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  -- SQL editor / service role (auth.uid() is null) and admins may change anything.
  if auth.uid() is null or public.is_admin() then
    if new.admin_approved and not old.admin_approved then
      new.admin_approved_at := coalesce(new.admin_approved_at, now());
      new.approved_by := coalesce(new.approved_by, auth.uid());
    end if;
    return new;
  end if;
  new.id := old.id;
  new.email := old.email;
  new.role := old.role;
  new.status := old.status;
  new.admin_approved := old.admin_approved;
  new.admin_approved_at := old.admin_approved_at;
  new.approved_by := old.approved_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists users_guard on public.users;
create trigger users_guard before update on public.users
  for each row execute procedure public.users_guard();

-- Instructors that already existed before approval was enforced keep working.
-- First run only (certificates does not exist yet): a re-run must not approve pending instructors.
do $$ begin
  if to_regclass('public.certificates') is null then
    update public.users set admin_approved = true, admin_approved_at = coalesce(admin_approved_at, now())
    where role = 'instructor' and admin_approved = false;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. NEW COLUMNS
-- ---------------------------------------------------------------------
alter table public.courses add column if not exists rejection_reason text;
alter table public.courses add column if not exists learning_outcomes text;   -- one outcome per line
alter table public.courses add column if not exists requirements text;        -- one requirement per line

alter table public.lessons add column if not exists attachment_url text;      -- downloadable material (FR-046)

alter table public.forum_topics add column if not exists type text not null default 'discussion';
do $$ begin
  alter table public.forum_topics add constraint forum_topics_type_check check (type in ('discussion', 'question'));
exception when duplicate_object then null; end $$;

alter table public.reviews alter column is_approved set default true;
alter table public.transactions alter column currency set default 'VND';

create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_courses_instructor on public.courses(instructor_id);
create index if not exists idx_courses_category on public.courses(category_id);
create index if not exists idx_modules_course on public.modules(course_id);
create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
create index if not exists idx_transactions_student on public.transactions(student_id);
create index if not exists idx_transactions_course on public.transactions(course_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date);
create index if not exists idx_reviews_course on public.reviews(course_id);
create index if not exists idx_forum_topics_course on public.forum_topics(course_id);
create index if not exists idx_forum_replies_topic on public.forum_replies(topic_id);

-- ---------------------------------------------------------------------
-- 3. NEW TABLES
-- ---------------------------------------------------------------------
create table if not exists public.certificates (
  certificate_id serial primary key,
  enrollment_id integer not null unique references public.enrollments(enrollment_id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  course_id integer not null references public.courses(course_id) on delete cascade,
  certificate_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  issued_at timestamp with time zone default now()
);
alter table public.certificates enable row level security;

create table if not exists public.coupons (
  coupon_id serial primary key,
  code text not null unique,
  description text,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0,
  expires_at timestamp with time zone,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);
alter table public.coupons enable row level security;

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  site_name text not null default 'VIAN Academy',
  support_email text default 'support@vian.edu',
  support_phone text,
  maintenance_mode boolean not null default false,
  maintenance_message text default 'Hệ thống đang bảo trì, vui lòng quay lại sau.',
  allow_instructor_signup boolean not null default true,
  updated_at timestamp with time zone default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;
alter table public.app_settings enable row level security;

create table if not exists public.support_tickets (
  ticket_id serial primary key,
  user_id uuid references public.users(id) on delete set null,
  name text,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.support_tickets enable row level security;

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- users ------------------------------------------------------------------
drop policy if exists "Public profiles are viewable by everyone." on public.users;
drop policy if exists "Users can update own profile." on public.users;
drop policy if exists "users_select" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_update_admin" on public.users;
create policy "users_select" on public.users for select using (auth.uid() = id or public.is_admin());
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_update_admin" on public.users for update using (public.is_admin());

-- categories -------------------------------------------------------------
drop policy if exists "Categories are viewable by everyone." on public.categories;
drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_select" on public.categories for select using (true);
create policy "categories_admin_all" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- courses ----------------------------------------------------------------
drop policy if exists "Courses are viewable by everyone." on public.courses;
drop policy if exists "Instructors can insert courses." on public.courses;
drop policy if exists "Instructors can update own courses." on public.courses;
drop policy if exists "courses_select" on public.courses;
drop policy if exists "courses_insert" on public.courses;
drop policy if exists "courses_update" on public.courses;
drop policy if exists "courses_delete" on public.courses;
create policy "courses_select" on public.courses for select
  using (status = 'published' or instructor_id = auth.uid() or public.is_admin());
create policy "courses_insert" on public.courses for insert
  with check (instructor_id = auth.uid() and public.is_approved_instructor());
create policy "courses_update" on public.courses for update
  using (instructor_id = auth.uid() or public.is_admin());
create policy "courses_delete" on public.courses for delete
  using ((instructor_id = auth.uid() and status in ('draft', 'rejected')) or public.is_admin());

-- modules ----------------------------------------------------------------
drop policy if exists "Modules are viewable by everyone." on public.modules;
drop policy if exists "Instructors can insert modules." on public.modules;
drop policy if exists "modules_select" on public.modules;
drop policy if exists "modules_write" on public.modules;
create policy "modules_select" on public.modules for select using (public.course_visible(course_id));
create policy "modules_write" on public.modules for all
  using (public.owns_course(course_id) or public.is_admin())
  with check (public.owns_course(course_id) or public.is_admin());

-- lessons ----------------------------------------------------------------
-- Full rows (with video URLs) only for enrolled students, the instructor and admins,
-- plus free-preview lessons of published courses. Everyone else uses course_outline.
drop policy if exists "Lessons are viewable by everyone." on public.lessons;
drop policy if exists "Instructors can insert lessons." on public.lessons;
drop policy if exists "lessons_select" on public.lessons;
drop policy if exists "lessons_write" on public.lessons;
create policy "lessons_select" on public.lessons for select
  using (
    public.can_access_course((select m.course_id from public.modules m where m.module_id = lessons.module_id))
    or (is_preview and public.course_visible((select m.course_id from public.modules m where m.module_id = lessons.module_id)))
  );
create policy "lessons_write" on public.lessons for all
  using (exists (select 1 from public.modules m where m.module_id = lessons.module_id and (public.owns_course(m.course_id) or public.is_admin())))
  with check (exists (select 1 from public.modules m where m.module_id = lessons.module_id and (public.owns_course(m.course_id) or public.is_admin())));

-- enrollments ------------------------------------------------------------
-- Paid courses are enrolled through checkout(); students may self-enroll only in free courses.
drop policy if exists "Users can view own enrollments." on public.enrollments;
drop policy if exists "Users can enroll themselves." on public.enrollments;
drop policy if exists "enrollments_select" on public.enrollments;
drop policy if exists "enrollments_insert_free" on public.enrollments;
drop policy if exists "enrollments_admin" on public.enrollments;
create policy "enrollments_select" on public.enrollments for select
  using (student_id = auth.uid() or public.owns_course(course_id) or public.is_admin());
create policy "enrollments_insert_free" on public.enrollments for insert
  with check (
    student_id = auth.uid() and public.is_active_user()
    and exists (select 1 from public.courses c where c.course_id = enrollments.course_id and c.status = 'published' and c.price = 0)
  );
create policy "enrollments_admin" on public.enrollments for all using (public.is_admin()) with check (public.is_admin());

-- lesson_progress --------------------------------------------------------
drop policy if exists "Users can view own progress." on public.lesson_progress;
drop policy if exists "progress_select" on public.lesson_progress;
drop policy if exists "progress_insert" on public.lesson_progress;
drop policy if exists "progress_update" on public.lesson_progress;
create policy "progress_select" on public.lesson_progress for select
  using (exists (select 1 from public.enrollments e where e.enrollment_id = lesson_progress.enrollment_id
                 and (e.student_id = auth.uid() or public.owns_course(e.course_id) or public.is_admin())));
create policy "progress_insert" on public.lesson_progress for insert
  with check (exists (select 1 from public.enrollments e where e.enrollment_id = lesson_progress.enrollment_id
                      and e.student_id = auth.uid() and e.status in ('active', 'completed')));
create policy "progress_update" on public.lesson_progress for update
  using (exists (select 1 from public.enrollments e where e.enrollment_id = lesson_progress.enrollment_id
                 and e.student_id = auth.uid() and e.status in ('active', 'completed')));

-- transactions (written only by checkout() / refund_transaction()) ------
drop policy if exists "Users can view own transactions." on public.transactions;
drop policy if exists "transactions_select" on public.transactions;
create policy "transactions_select" on public.transactions for select
  using (student_id = auth.uid() or public.owns_course(course_id) or public.is_admin());

-- reviews ----------------------------------------------------------------
drop policy if exists "Approved reviews are public." on public.reviews;
drop policy if exists "reviews_select" on public.reviews;
drop policy if exists "reviews_insert" on public.reviews;
drop policy if exists "reviews_update_own" on public.reviews;
drop policy if exists "reviews_delete" on public.reviews;
drop policy if exists "reviews_admin" on public.reviews;
create policy "reviews_select" on public.reviews for select
  using (is_approved or student_id = auth.uid() or public.is_admin());
create policy "reviews_insert" on public.reviews for insert
  with check (
    student_id = auth.uid() and public.is_active_user()
    and exists (select 1 from public.enrollments e where e.course_id = reviews.course_id and e.student_id = auth.uid() and e.status in ('active', 'completed'))
  );
create policy "reviews_update_own" on public.reviews for update using (student_id = auth.uid());
create policy "reviews_delete" on public.reviews for delete using (student_id = auth.uid() or public.is_admin());
create policy "reviews_admin" on public.reviews for update using (public.is_admin());

-- forum_topics -----------------------------------------------------------
drop policy if exists "Topics are public." on public.forum_topics;
drop policy if exists "topics_select" on public.forum_topics;
drop policy if exists "topics_insert" on public.forum_topics;
drop policy if exists "topics_update" on public.forum_topics;
drop policy if exists "topics_delete" on public.forum_topics;
create policy "topics_select" on public.forum_topics for select using (true);
create policy "topics_insert" on public.forum_topics for insert
  with check (author_id = auth.uid() and public.is_active_user());
create policy "topics_update" on public.forum_topics for update using (author_id = auth.uid() or public.is_admin());
create policy "topics_delete" on public.forum_topics for delete using (author_id = auth.uid() or public.is_admin());

-- forum_replies ----------------------------------------------------------
drop policy if exists "Replies are public." on public.forum_replies;
drop policy if exists "replies_select" on public.forum_replies;
drop policy if exists "replies_insert" on public.forum_replies;
drop policy if exists "replies_update" on public.forum_replies;
drop policy if exists "replies_delete" on public.forum_replies;
create policy "replies_select" on public.forum_replies for select using (true);
create policy "replies_insert" on public.forum_replies for insert
  with check (
    author_id = auth.uid() and public.is_active_user()
    and exists (select 1 from public.forum_topics t where t.topic_id = forum_replies.topic_id and not t.is_locked)
  );
create policy "replies_update" on public.forum_replies for update using (author_id = auth.uid() or public.is_admin());
create policy "replies_delete" on public.forum_replies for delete using (author_id = auth.uid() or public.is_admin());

-- certificates (public so a certificate code can be verified) -----------
drop policy if exists "certificates_select" on public.certificates;
create policy "certificates_select" on public.certificates for select using (true);

-- coupons (admin only; students validate through quote_checkout()) -----
drop policy if exists "coupons_admin" on public.coupons;
create policy "coupons_admin" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- app_settings -----------------------------------------------------------
drop policy if exists "settings_select" on public.app_settings;
drop policy if exists "settings_update" on public.app_settings;
create policy "settings_select" on public.app_settings for select using (true);
create policy "settings_update" on public.app_settings for update using (public.is_admin());

-- support_tickets (guests may submit too) -------------------------------
drop policy if exists "tickets_insert" on public.support_tickets;
drop policy if exists "tickets_select" on public.support_tickets;
drop policy if exists "tickets_update" on public.support_tickets;
create policy "tickets_insert" on public.support_tickets for insert
  with check (user_id is null or user_id = auth.uid());
create policy "tickets_select" on public.support_tickets for select
  using ((user_id is not null and user_id = auth.uid()) or public.is_admin());
create policy "tickets_update" on public.support_tickets for update using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. TRIGGERS
-- ---------------------------------------------------------------------
-- 5a. Recalculate cached course counters. Uses app.bypass so courses_guard lets it through.
create or replace function public.recalc_course_stats(p_course int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_course is null then return; end if;
  perform set_config('app.bypass', 'on', true);
  update public.courses c set
    total_lessons = (select count(*) from public.lessons l join public.modules m on m.module_id = l.module_id where m.course_id = p_course),
    duration_hours = round(coalesce((select sum(l.video_duration) from public.lessons l join public.modules m on m.module_id = l.module_id where m.course_id = p_course), 0) / 3600.0, 2),
    total_enrollments = (select count(*) from public.enrollments e where e.course_id = p_course and e.status <> 'dropped'),
    rating = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.course_id = p_course and r.is_approved), 0)
  where c.course_id = p_course;
  perform set_config('app.bypass', 'off', true);
end;
$$;
revoke execute on function public.recalc_course_stats(int) from public, anon, authenticated;

-- 5b. Course guard: instructors cannot self-publish or edit computed columns.
create or replace function public.courses_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.is_admin() then
      new.status := case when new.status = 'pending' then 'pending' else 'draft' end;
      new.rating := 0;
      new.total_enrollments := 0;
      new.total_lessons := 0;
      new.duration_hours := 0;
      new.published_at := null;
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  new.updated_at := now();
  if coalesce(current_setting('app.bypass', true), '') = 'on' or auth.uid() is null or public.is_admin() then
    if new.status = 'published' and old.status <> 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
    return new;
  end if;

  new.instructor_id := old.instructor_id;
  new.rating := old.rating;
  new.total_enrollments := old.total_enrollments;
  new.total_lessons := old.total_lessons;
  new.duration_hours := old.duration_hours;
  new.published_at := old.published_at;
  if new.status is distinct from old.status then
    if not (
         (old.status in ('draft', 'rejected') and new.status = 'pending')   -- submit for review
      or (old.status = 'pending' and new.status = 'draft')                  -- withdraw
      or (old.status = 'published' and new.status = 'draft')                -- unpublish
    ) then
      raise exception 'Không được phép chuyển trạng thái khoá học từ % sang %', old.status, new.status;
    end if;
    if new.status = 'pending' then new.rejection_reason := null; end if;
  else
    new.rejection_reason := old.rejection_reason;
  end if;
  return new;
end;
$$;
drop trigger if exists courses_guard on public.courses;
create trigger courses_guard before insert or update on public.courses
  for each row execute procedure public.courses_guard();

-- 5c. Counters.
create or replace function public.on_lessons_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recalc_course_stats((select course_id from public.modules where module_id = old.module_id));
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalc_course_stats((select course_id from public.modules where module_id = new.module_id));
  end if;
  return null;
end;
$$;
drop trigger if exists lessons_changed on public.lessons;
create trigger lessons_changed after insert or update or delete on public.lessons
  for each row execute procedure public.on_lessons_changed();

create or replace function public.on_course_child_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.recalc_course_stats(old.course_id); end if;
  if tg_op in ('INSERT', 'UPDATE') then perform public.recalc_course_stats(new.course_id); end if;
  return null;
end;
$$;
drop trigger if exists modules_changed on public.modules;
create trigger modules_changed after delete on public.modules
  for each row execute procedure public.on_course_child_changed();
drop trigger if exists enrollments_changed on public.enrollments;
create trigger enrollments_changed after insert or update of status or delete on public.enrollments
  for each row execute procedure public.on_course_child_changed();
drop trigger if exists reviews_changed on public.reviews;
create trigger reviews_changed after insert or update or delete on public.reviews
  for each row execute procedure public.on_course_child_changed();

-- 5d. Lesson progress -> enrollment progress -> certificate (FR-048..052).
create or replace function public.lesson_progress_before()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.is_completed and new.completion_date is null then new.completion_date := now(); end if;
  if not new.is_completed then new.completion_date := null; end if;
  return new;
end;
$$;
drop trigger if exists lesson_progress_before on public.lesson_progress;
create trigger lesson_progress_before before insert or update on public.lesson_progress
  for each row execute procedure public.lesson_progress_before();

create or replace function public.lesson_progress_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_course int; v_student uuid; v_total int; v_done int; v_pct numeric;
begin
  select course_id, student_id into v_course, v_student from public.enrollments where enrollment_id = new.enrollment_id;
  select count(*) into v_total from public.lessons l join public.modules m on m.module_id = l.module_id where m.course_id = v_course;
  select count(*) into v_done
    from public.lesson_progress lp
    join public.lessons l on l.lesson_id = lp.lesson_id
    join public.modules m on m.module_id = l.module_id
   where lp.enrollment_id = new.enrollment_id and lp.is_completed and m.course_id = v_course;
  v_pct := case when v_total = 0 then 0 else least(100, round(v_done * 100.0 / v_total, 2)) end;

  update public.enrollments set
    progress_percentage = v_pct,
    last_accessed_at = now(),
    updated_at = now(),
    status = case when v_pct >= 100 then 'completed' when status = 'completed' then 'active' else status end,
    completion_date = case when v_pct >= 100 then coalesce(completion_date, current_date) else null end
  where enrollment_id = new.enrollment_id;

  if v_pct >= 100 then
    insert into public.certificates (enrollment_id, student_id, course_id)
    values (new.enrollment_id, v_student, v_course)
    on conflict (enrollment_id) do nothing;
  end if;
  return null;
end;
$$;
drop trigger if exists lesson_progress_after on public.lesson_progress;
create trigger lesson_progress_after after insert or update on public.lesson_progress
  for each row execute procedure public.lesson_progress_after();

-- 5e. Forum guards & counters.
create or replace function public.forum_topics_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.bypass', true), '') = 'on' or auth.uid() is null or public.is_admin() then
    if tg_op = 'UPDATE' then new.updated_at := now(); end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_pinned := false; new.is_locked := false; new.view_count := 0; new.reply_count := 0;
  else
    new.author_id := old.author_id; new.is_pinned := old.is_pinned; new.is_locked := old.is_locked;
    new.view_count := old.view_count; new.reply_count := old.reply_count; new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists forum_topics_guard on public.forum_topics;
create trigger forum_topics_guard before insert or update on public.forum_topics
  for each row execute procedure public.forum_topics_guard();

create or replace function public.forum_replies_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.bypass', true), '') = 'on' or auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then new.is_solution := false;
  else new.is_solution := old.is_solution; new.author_id := old.author_id; new.topic_id := old.topic_id; new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists forum_replies_guard on public.forum_replies;
create trigger forum_replies_guard before insert or update on public.forum_replies
  for each row execute procedure public.forum_replies_guard();

create or replace function public.forum_replies_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_topic int := coalesce(new.topic_id, old.topic_id);
begin
  perform set_config('app.bypass', 'on', true);
  update public.forum_topics set reply_count = (select count(*) from public.forum_replies where topic_id = v_topic)
  where topic_id = v_topic;
  perform set_config('app.bypass', 'off', true);
  return null;
end;
$$;
drop trigger if exists forum_replies_count on public.forum_replies;
create trigger forum_replies_count after insert or delete on public.forum_replies
  for each row execute procedure public.forum_replies_count();

-- 5f. updated_at on tickets.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists support_tickets_touch on public.support_tickets;
create trigger support_tickets_touch before update on public.support_tickets
  for each row execute procedure public.touch_updated_at();
drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch before update on public.app_settings
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. RPC FUNCTIONS
-- ---------------------------------------------------------------------
-- 6a. Price quote for a cart (FR-037, FR-040). Skips courses already owned/enrolled.
create or replace function public.quote_checkout(p_course_ids int[], p_coupon text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_coupon public.coupons%rowtype;
  v_coupon_ok boolean := false;
  v_coupon_msg text := null;
  v_fixed_left numeric := 0;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  r record;
  d numeric;
begin
  if p_coupon is not null and btrim(p_coupon) <> '' then
    select * into v_coupon from public.coupons where upper(code) = upper(btrim(p_coupon));
    if not found then v_coupon_msg := 'Mã giảm giá không tồn tại';
    elsif not v_coupon.is_active then v_coupon_msg := 'Mã giảm giá đã bị vô hiệu hoá';
    elsif v_coupon.expires_at is not null and v_coupon.expires_at < now() then v_coupon_msg := 'Mã giảm giá đã hết hạn';
    elsif v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then v_coupon_msg := 'Mã giảm giá đã hết lượt sử dụng';
    else
      v_coupon_ok := true;
      v_coupon_msg := 'Đã áp dụng mã ' || v_coupon.code;
      if v_coupon.discount_type = 'fixed' then v_fixed_left := v_coupon.discount_value; end if;
    end if;
  end if;

  for r in
    select c.course_id, c.title, c.price, c.instructor_id, c.thumbnail_url
      from public.courses c
     where c.course_id = any(p_course_ids) and c.status = 'published'
     order by c.price desc, c.course_id
  loop
    continue when v_uid is not null and (
      r.instructor_id = v_uid
      or exists (select 1 from public.enrollments e where e.course_id = r.course_id and e.student_id = v_uid and e.status <> 'dropped')
    );
    d := 0;
    if v_coupon_ok then
      if v_coupon.discount_type = 'percent' then
        d := round(r.price * least(v_coupon.discount_value, 100) / 100, 0);
      else
        d := least(r.price, v_fixed_left);
        v_fixed_left := v_fixed_left - d;
      end if;
    end if;
    v_subtotal := v_subtotal + r.price;
    v_discount := v_discount + d;
    v_items := v_items || jsonb_build_object(
      'course_id', r.course_id, 'title', r.title, 'thumbnail_url', r.thumbnail_url,
      'price', r.price, 'discount', d, 'amount', r.price - d);
  end loop;

  return jsonb_build_object(
    'items', v_items,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_subtotal - v_discount,
    'coupon_valid', v_coupon_ok,
    'coupon_message', v_coupon_msg,
    'coupon_id', case when v_coupon_ok then v_coupon.coupon_id end
  );
end;
$$;

-- 6b. Checkout (FR-030, FR-038..041). Payment is SIMULATED: every call succeeds and
--     records a 'SIM-' reference. Replace with a Stripe Edge Function + webhook later.
create or replace function public.checkout(p_course_ids int[], p_coupon text default null, p_payment_method text default 'credit_card')
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  q jsonb;
  it jsonb;
  v_tx int;
  v_ids int[] := '{}';
  v_ref text;
  v_coupon_ok boolean;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập để thanh toán'; end if;
  if not public.is_active_user() then raise exception 'Tài khoản của bạn đang bị khoá'; end if;
  if p_payment_method not in ('credit_card', 'paypal', 'bank_transfer') then
    raise exception 'Phương thức thanh toán không hợp lệ';
  end if;

  q := public.quote_checkout(p_course_ids, p_coupon);
  v_coupon_ok := (q->>'coupon_valid')::boolean;
  if p_coupon is not null and btrim(p_coupon) <> '' and not v_coupon_ok then
    raise exception '%', q->>'coupon_message';
  end if;
  if jsonb_array_length(q->'items') = 0 then
    raise exception 'Không có khoá học hợp lệ để thanh toán (có thể bạn đã sở hữu các khoá này)';
  end if;

  if v_coupon_ok then
    update public.coupons set used_count = used_count + 1
     where coupon_id = (q->>'coupon_id')::int and (max_uses is null or used_count < max_uses);
    if not found then raise exception 'Mã giảm giá đã hết lượt sử dụng'; end if;
  end if;

  v_ref := 'SIM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));
  for it in select value from jsonb_array_elements(q->'items') loop
    insert into public.transactions (student_id, course_id, amount, currency, payment_method, payment_status,
                                     payment_gateway_transaction_id, coupon_code, discount_amount)
    values (v_uid, (it->>'course_id')::int, (it->>'amount')::numeric, 'VND', p_payment_method, 'completed',
            v_ref, case when v_coupon_ok then upper(btrim(p_coupon)) end, (it->>'discount')::numeric)
    returning transaction_id into v_tx;
    v_ids := v_ids || v_tx;

    insert into public.enrollments (student_id, course_id)
    values (v_uid, (it->>'course_id')::int)
    on conflict (student_id, course_id) do update set status = 'active', updated_at = now();
  end loop;

  return jsonb_build_object('reference', v_ref, 'transaction_ids', to_jsonb(v_ids), 'total', q->'total', 'items', q->'items');
end;
$$;

-- 6c. Refund (FR-086): admin only. Marks the transaction refunded and drops the enrollment.
create or replace function public.refund_transaction(p_transaction_id int)
returns void language plpgsql security definer set search_path = public as $$
declare t public.transactions%rowtype;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được hoàn tiền'; end if;
  select * into t from public.transactions where transaction_id = p_transaction_id;
  if not found then raise exception 'Không tìm thấy giao dịch'; end if;
  if t.payment_status <> 'completed' then raise exception 'Chỉ hoàn tiền được giao dịch đã hoàn thành'; end if;
  update public.transactions set payment_status = 'refunded' where transaction_id = p_transaction_id;
  update public.enrollments set status = 'dropped', updated_at = now()
   where student_id = t.student_id and course_id = t.course_id;
end;
$$;

-- 6d. Q&A: mark/unmark accepted answer (FR-061). Topic author, course instructor or admin.
create or replace function public.mark_solution(p_reply_id int)
returns void language plpgsql security definer set search_path = public as $$
declare v_topic public.forum_topics%rowtype; v_current boolean;
begin
  select t.* into v_topic from public.forum_topics t join public.forum_replies r on r.topic_id = t.topic_id where r.reply_id = p_reply_id;
  if not found then raise exception 'Không tìm thấy câu trả lời'; end if;
  if not (v_topic.author_id = auth.uid() or public.is_admin() or (v_topic.course_id is not null and public.owns_course(v_topic.course_id))) then
    raise exception 'Bạn không có quyền đánh dấu câu trả lời';
  end if;
  select is_solution into v_current from public.forum_replies where reply_id = p_reply_id;
  perform set_config('app.bypass', 'on', true);
  update public.forum_replies set is_solution = false where topic_id = v_topic.topic_id;
  update public.forum_replies set is_solution = not v_current where reply_id = p_reply_id;
  perform set_config('app.bypass', 'off', true);
end;
$$;

create or replace function public.increment_topic_view(p_topic_id int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass', 'on', true);
  update public.forum_topics set view_count = view_count + 1 where topic_id = p_topic_id;
  perform set_config('app.bypass', 'off', true);
end;
$$;

-- 6e. Instructor dashboard (FR-068..071).
create or replace function public.instructor_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); result jsonb;
begin
  if v_uid is null then raise exception 'Chưa đăng nhập'; end if;
  with my as (
    select course_id, title, status, price, rating, total_enrollments from public.courses where instructor_id = v_uid
  ), tx as (
    select t.* from public.transactions t join my on my.course_id = t.course_id where t.payment_status = 'completed'
  ), months as (
    select generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') as m
  )
  select jsonb_build_object(
    'total_revenue', coalesce((select sum(amount) from tx), 0),
    'month_revenue', coalesce((select sum(amount) from tx where transaction_date >= date_trunc('month', now())), 0),
    'total_students', (select count(distinct e.student_id) from public.enrollments e join my on my.course_id = e.course_id where e.status <> 'dropped'),
    'total_enrollments', (select count(*) from public.enrollments e join my on my.course_id = e.course_id where e.status <> 'dropped'),
    'completed_enrollments', (select count(*) from public.enrollments e join my on my.course_id = e.course_id where e.status = 'completed'),
    'published_courses', (select count(*) from my where status = 'published'),
    'pending_courses', (select count(*) from my where status = 'pending'),
    'draft_courses', (select count(*) from my where status in ('draft', 'rejected')),
    'avg_rating', coalesce((select round(avg(rating), 2) from my where rating > 0), 0),
    'open_questions', (select count(*) from public.forum_topics ft join my on my.course_id = ft.course_id
                        where ft.type = 'question' and not exists (select 1 from public.forum_replies fr where fr.topic_id = ft.topic_id and fr.is_solution)),
    'revenue_by_month', (select coalesce(jsonb_agg(jsonb_build_object(
                            'month', to_char(months.m, 'MM/YYYY'),
                            'revenue', coalesce((select sum(amount) from tx where date_trunc('month', tx.transaction_date) = months.m), 0)
                          ) order by months.m), '[]'::jsonb) from months),
    'revenue_by_course', (select coalesce(jsonb_agg(x order by x.revenue desc), '[]'::jsonb) from (
                            select my.course_id, my.title, my.status, my.total_enrollments as students, my.rating,
                                   coalesce(sum(tx.amount), 0) as revenue
                              from my left join tx on tx.course_id = my.course_id
                             group by my.course_id, my.title, my.status, my.total_enrollments, my.rating) x),
    'recent_enrollments', (select coalesce(jsonb_agg(y), '[]'::jsonb) from (
                            select e.enrollment_id, e.created_at, e.progress_percentage, e.status, my.title as course_title,
                                   trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as student_name, u.email
                              from public.enrollments e join my on my.course_id = e.course_id join public.users u on u.id = e.student_id
                             order by e.created_at desc limit 10) y)
  ) into result;
  return result;
end;
$$;

-- 6f. Admin dashboard & financial reports (FR-072..085).
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới xem được báo cáo'; end if;
  with tx as (
    select * from public.transactions where payment_status = 'completed'
  ), months as (
    select generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') as m
  )
  select jsonb_build_object(
    'total_revenue', coalesce((select sum(amount) from tx), 0),
    'today_revenue', coalesce((select sum(amount) from tx where transaction_date >= date_trunc('day', now())), 0),
    'week_revenue', coalesce((select sum(amount) from tx where transaction_date >= date_trunc('week', now())), 0),
    'month_revenue', coalesce((select sum(amount) from tx where transaction_date >= date_trunc('month', now())), 0),
    'year_revenue', coalesce((select sum(amount) from tx where transaction_date >= date_trunc('year', now())), 0),
    'refunded_amount', coalesce((select sum(amount) from public.transactions where payment_status = 'refunded'), 0),
    'transactions_count', (select count(*) from tx),
    'users_total', (select count(*) from public.users),
    'users_by_role', (select coalesce(jsonb_object_agg(role, n), '{}'::jsonb) from (select coalesce(role, 'student') as role, count(*) n from public.users group by 1) r),
    'new_users_30d', (select count(*) from public.users where created_at >= now() - interval '30 days'),
    'suspended_users', (select count(*) from public.users where status = 'suspended'),
    'pending_instructors', (select count(*) from public.users where role = 'instructor' and not admin_approved),
    'courses_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.courses group by 1) s),
    'total_enrollments', (select count(*) from public.enrollments where status <> 'dropped'),
    'completed_enrollments', (select count(*) from public.enrollments where status = 'completed'),
    'certificates', (select count(*) from public.certificates),
    'open_tickets', (select count(*) from public.support_tickets where status in ('open', 'in_progress')),
    'revenue_by_month', (select coalesce(jsonb_agg(jsonb_build_object(
                            'month', to_char(months.m, 'MM/YYYY'),
                            'revenue', coalesce((select sum(amount) from tx where date_trunc('month', tx.transaction_date) = months.m), 0)
                          ) order by months.m), '[]'::jsonb) from months),
    'revenue_by_course', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
                            select c.course_id, c.title, sum(tx.amount) as revenue, count(*) as sales
                              from tx join public.courses c on c.course_id = tx.course_id
                             group by c.course_id, c.title order by revenue desc limit 10) x),
    'revenue_by_instructor', (select coalesce(jsonb_agg(y), '[]'::jsonb) from (
                            select u.id, trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as name, u.email,
                                   sum(tx.amount) as revenue, count(*) as sales
                              from tx join public.courses c on c.course_id = tx.course_id join public.users u on u.id = c.instructor_id
                             group by u.id, u.first_name, u.last_name, u.email order by revenue desc limit 10) y)
  ) into result;
  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. VIEW: public curriculum outline (titles/durations, never video URLs)
-- ---------------------------------------------------------------------
create or replace view public.course_outline as
  select l.lesson_id, l.module_id, m.course_id, l.title, l.content_type, l.video_duration, l.order_index, l.is_preview
    from public.lessons l
    join public.modules m on m.module_id = l.module_id
    join public.courses c on c.course_id = m.course_id
   where c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin();
grant select on public.course_outline to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. STORAGE: avatars + course thumbnails (public read, owner-folder write)
--    Files are stored as <bucket>/<auth.uid()>/<filename>.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "lms_media_read" on storage.objects;
drop policy if exists "lms_media_insert" on storage.objects;
drop policy if exists "lms_media_update" on storage.objects;
drop policy if exists "lms_media_delete" on storage.objects;
create policy "lms_media_read" on storage.objects for select
  using (bucket_id in ('avatars', 'thumbnails'));
create policy "lms_media_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'thumbnails') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "lms_media_update" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'thumbnails') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "lms_media_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'thumbnails') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Make an account admin (run manually, once):
--   update public.users set role = 'admin', admin_approved = true where email = 'you@example.com';
-- ---------------------------------------------------------------------
