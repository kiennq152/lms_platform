-- =====================================================
-- VIAN Academy LMS Database Schema (Supabase Version)
-- Database: PostgreSQL
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (formerly users)
-- Links to Supabase auth.users
-- =====================================================
create table public.users (
  id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  role text check (role in ('student', 'instructor', 'admin')),
  status text default 'active' check (status in ('active', 'inactive', 'suspended')),
  avatar_url text,
  phone text,
  bio text,
  social_link text,
  admin_approved boolean default false,
  admin_approved_at timestamp with time zone,
  approved_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  last_login timestamp with time zone
);

-- RLS Policies
alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone."
  on users for select
  using ( true );

create policy "Users can update own profile."
  on users for update
  using ( auth.uid() = id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, first_name, last_name, role, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =====================================================
-- 2. CATEGORIES TABLE
-- =====================================================
create table public.categories (
    category_id serial primary key,
    name text not null,
    slug text unique not null,
    description text,
    icon_url text,
    parent_category_id integer references categories(category_id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.categories enable row level security;
create policy "Categories are viewable by everyone."
  on categories for select using ( true );

-- =====================================================
-- 3. COURSES TABLE
-- =====================================================
create table public.courses (
    course_id serial primary key,
    instructor_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text not null,
    short_description text,
    price decimal(10, 2) not null default 0.00 check (price >= 0),
    category_id integer references categories(category_id) on delete set null,
    thumbnail_url text,
    status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'published')),
    rating decimal(3, 2) default 0.00 check (rating >= 0 and rating <= 5),
    total_enrollments integer default 0,
    total_lessons integer default 0,
    duration_hours decimal(5, 2) default 0,
    level text check (level in ('beginner', 'intermediate', 'advanced')),
    language text default 'English',
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    published_at timestamp with time zone
);

alter table public.courses enable row level security;
create policy "Courses are viewable by everyone."
  on courses for select using ( true );
create policy "Instructors can insert courses."
  on courses for insert with check ( auth.uid() = instructor_id );
create policy "Instructors can update own courses."
  on courses for update using ( auth.uid() = instructor_id );

-- =====================================================
-- 4. MODULES TABLE
-- =====================================================
create table public.modules (
    module_id serial primary key,
    course_id integer not null references courses(course_id) on delete cascade,
    title text not null,
    description text,
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.modules enable row level security;
create policy "Modules are viewable by everyone." on modules for select using ( true );

-- =====================================================
-- 5. LESSONS TABLE
-- =====================================================
create table public.lessons (
    lesson_id serial primary key,
    module_id integer not null references modules(module_id) on delete cascade,
    title text not null,
    description text,
    content_type text not null check (content_type in ('video', 'text', 'quiz', 'assignment')),
    video_url text,
    youtube_url text,
    video_duration integer default 0,
    content_text text,
    content_data jsonb,
    order_index integer not null default 0,
    is_preview boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.lessons enable row level security;
create policy "Lessons are viewable by everyone." on lessons for select using ( true );


-- =====================================================
-- 6. ENROLLMENTS TABLE
-- =====================================================
create table public.enrollments (
    enrollment_id serial primary key,
    student_id uuid not null references public.users(id) on delete cascade,
    course_id integer not null references courses(course_id) on delete cascade,
    enrollment_date date not null default current_date,
    completion_date date,
    progress_percentage decimal(5, 2) default 0.00 check (progress_percentage >= 0 and progress_percentage <= 100),
    status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
    last_accessed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    
    unique (student_id, course_id)
);
alter table public.enrollments enable row level security;
create policy "Users can view own enrollments." 
  on enrollments for select using ( auth.uid() = student_id );
create policy "Users can enroll themselves." 
  on enrollments for insert with check ( auth.uid() = student_id );

-- =====================================================
-- 7. LESSON PROGRESS TABLE
-- =====================================================
create table public.lesson_progress (
    progress_id serial primary key,
    enrollment_id integer not null references enrollments(enrollment_id) on delete cascade,
    lesson_id integer not null references lessons(lesson_id) on delete cascade,
    is_completed boolean default false,
    watch_time_seconds integer default 0,
    completion_date timestamp with time zone,
    last_position integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    
    unique (enrollment_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create policy "Users can view own progress." 
  on lesson_progress for select 
  using ( exists (select 1 from enrollments where enrollments.enrollment_id = lesson_progress.enrollment_id and enrollments.student_id = auth.uid()) );

-- =====================================================
-- 8. TRANSACTIONS TABLE
-- =====================================================
create table public.transactions (
    transaction_id serial primary key,
    student_id uuid not null references public.users(id) on delete cascade,
    course_id integer references courses(course_id) on delete set null,
    amount decimal(10, 2) not null check (amount >= 0),
    currency text default 'USD',
    payment_method text not null check (payment_method in ('credit_card', 'paypal', 'bank_transfer')),
    payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
    payment_gateway_transaction_id text,
    coupon_code text,
    discount_amount decimal(10, 2) default 0.00,
    transaction_date timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.transactions enable row level security;
create policy "Users can view own transactions." on transactions for select using (auth.uid() = student_id );

-- =====================================================
-- 9. REVIEWS TABLE
-- =====================================================
create table public.reviews (
    review_id serial primary key,
    course_id integer not null references courses(course_id) on delete cascade,
    student_id uuid not null references public.users(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    is_approved boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    
    unique (course_id, student_id)
);
alter table public.reviews enable row level security;
create policy "Approved reviews are public." on reviews for select using ( is_approved = true );

-- =====================================================
-- 10. FORUM TOPICS TABLE
-- =====================================================
create table public.forum_topics (
    topic_id serial primary key,
    course_id integer references courses(course_id) on delete cascade,
    author_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    content text not null,
    is_pinned boolean default false,
    is_locked boolean default false,
    view_count integer default 0,
    reply_count integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.forum_topics enable row level security;
create policy "Topics are public." on forum_topics for select using ( true );

-- =====================================================
-- 11. FORUM REPLIES TABLE
-- =====================================================
create table public.forum_replies (
    reply_id serial primary key,
    topic_id integer not null references forum_topics(topic_id) on delete cascade,
    author_id uuid not null references public.users(id) on delete cascade,
    content text not null,
    is_solution boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.forum_replies enable row level security;
create policy "Replies are public." on forum_replies for select using ( true );

