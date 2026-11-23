-- Students keep access to courses they are enrolled in after the instructor hides them
-- (draft / pending / rejected). Safe to run more than once.

create or replace function public.course_visible(p_course int)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_access_course(p_course)
      or exists (select 1 from public.courses where course_id = p_course and status = 'published');
$$;

drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select
  using (status = 'published' or instructor_id = auth.uid() or public.can_access_course(course_id));

create or replace view public.course_outline as
  select l.lesson_id, l.module_id, m.course_id, l.title, l.content_type, l.video_duration, l.order_index, l.is_preview
    from public.lessons l
    join public.modules m on m.module_id = l.module_id
    join public.courses c on c.course_id = m.course_id
   where c.status = 'published' or public.can_access_course(c.course_id);
