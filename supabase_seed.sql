-- =====================================================
-- VIAN Academy LMS Database - SEED DATA
-- Purpose: Insert default categories, instructors, students, and courses for testing.
-- Run this script in the Supabase SQL Editor.
-- =====================================================

-- 1. Create Default Categories
INSERT INTO public.categories (name, slug, description)
VALUES 
    ('Lập Trình', 'lap-trinh', 'Các khóa học về lập trình, phần mềm, web, mobile.'),
    ('Thiết Kế', 'thiet-ke', 'Thiết kế đồ họa, UI/UX, và công cụ thiết kế.'),
    ('Marketing', 'marketing', 'Digital Marketing, SEO, Content và quảng cáo.'),
    ('Kinh Doanh', 'kinh-doanh', 'Quản trị kinh doanh, khởi nghiệp và tài chính.'),
    ('Ngoại Ngữ', 'ngoai-ngu', 'Tiếng Anh, Tiếng Hàn, Tiếng Nhật giao tiếp.')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Test Users into Auth.Users
-- Default password for all users below is: 123456
-- Using pre-computed bcrypt hash for '123456': $2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mS
DO $$
DECLARE
  instructor1_id uuid := '1e8a9d18-ba20-4dfb-bb66-4c91b1a41cc1';
  instructor2_id uuid := '2e8a9d18-ba20-4dfb-bb66-4c91b1a41cc2';
  student1_id uuid := '3e8a9d18-ba20-4dfb-bb66-4c91b1a41cc3';
  student2_id uuid := '4e8a9d18-ba20-4dfb-bb66-4c91b1a41cc4';
  student3_id uuid := '5e8a9d18-ba20-4dfb-bb66-4c91b1a41cc5';
  student4_id uuid := '6e8a9d18-ba20-4dfb-bb66-4c91b1a41cc6';
BEGIN
  -- 2.1 INSTRUCTOR 1
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'instructor1@vian.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
    ) VALUES (
      instructor1_id, '00000000-0000-0000-0000-000000000000', 'instructor1@vian.edu', 
      '$2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mS', -- Hash for 123456
      now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Tran", "last_name": "Giang Vien 1", "role": "instructor", "avatar_url": "https://i.pravatar.cc/150?u=instructor1"}',
      now(), now(), 'authenticated'
    );
  END IF;

  -- 2.2 INSTRUCTOR 2
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'instructor2@vian.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
    ) VALUES (
      instructor2_id, '00000000-0000-0000-0000-000000000000', 'instructor2@vian.edu', 
      '$2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mS',
      now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Pham", "last_name": "Giang Vien MKT", "role": "instructor", "avatar_url": "https://i.pravatar.cc/150?u=instructor2"}',
      now(), now(), 'authenticated'
    );
  END IF;

  -- 2.2 STUDENT 1
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student1@vian.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
    ) VALUES (
      student1_id, '00000000-0000-0000-0000-000000000000', 'student1@vian.edu', 
      '$2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mS',
      now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Nguyen", "last_name": "Hoc Vien 1", "role": "student", "avatar_url": "https://i.pravatar.cc/150?u=student1"}',
      now(), now(), 'authenticated'
    );
  END IF;

  -- 2.3 STUDENT 2
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student2@vian.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
    ) VALUES (
      student2_id, '00000000-0000-0000-0000-000000000000', 'student2@vian.edu', 
      '$2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mO',
      now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Le", "last_name": "Hoc Vien 2", "role": "student", "avatar_url": "https://i.pravatar.cc/150?u=student2"}',
      now(), now(), 'authenticated'
    );
  END IF;
  -- 2.4 STUDENT 3
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student3@vian.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
    ) VALUES (
      student3_id, '00000000-0000-0000-0000-000000000000', 'student3@vian.edu', 
      '$2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mO',
      now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Ngo", "last_name": "Hoc Vien 3", "role": "student", "avatar_url": "https://i.pravatar.cc/150?u=student3"}',
      now(), now(), 'authenticated'
    );
  END IF;

  -- 2.5 STUDENT 4
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student4@vian.edu') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
    ) VALUES (
      student4_id, '00000000-0000-0000-0000-000000000000', 'student4@vian.edu', 
      '$2a$10$wT0dZ/N0D2lUu/mR5GUM3.8h.LqT7A/V/7J0fK7R1O/L3e/wR6mO',
      now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Vu", "last_name": "Hoc Vien 4", "role": "student", "avatar_url": "https://i.pravatar.cc/150?u=student4"}',
      now(), now(), 'authenticated'
    );
  END IF;
END $$;

-- 3. Insert Default Courses
DO $$
DECLARE
  instructor1_id uuid := '1e8a9d18-ba20-4dfb-bb66-4c91b1a41cc1';
  instructor2_id uuid := '2e8a9d18-ba20-4dfb-bb66-4c91b1a41cc2';
  cat_it integer;
  cat_design integer;
  cat_biz integer;
  cat_mkt integer;
  cat_lang integer;
BEGIN
  -- Retrieve Category IDs
  SELECT category_id INTO cat_it FROM public.categories WHERE slug = 'lap-trinh';
  SELECT category_id INTO cat_design FROM public.categories WHERE slug = 'thiet-ke';
  SELECT category_id INTO cat_biz FROM public.categories WHERE slug = 'kinh-doanh';
  SELECT category_id INTO cat_mkt FROM public.categories WHERE slug = 'marketing';
  SELECT category_id INTO cat_lang FROM public.categories WHERE slug = 'ngoai-ngu';

  -- Wait 1 second to make sure auth trigger (handle_new_user) has populated public.users
  PERFORM pg_sleep(1); 

  -- Check if instructor 1 successfully populated in public.users to avoid foreign key violations
  IF EXISTS(SELECT 1 FROM public.users WHERE id = instructor1_id AND role = 'instructor') THEN

    IF NOT EXISTS(SELECT 1 FROM public.courses WHERE title = 'Lập trình React Native từ Zero đến Hero') THEN
      INSERT INTO public.courses (instructor_id, title, description, short_description, price, category_id, thumbnail_url, status, rating, total_enrollments, level, language)
      VALUES (
        instructor1_id, 
        'Lập trình React Native từ Zero đến Hero', 
        'Toàn bộ kiến thức cơ bản đến nâng cao về React Native, Expo, Supabase và Node.js để tự tay thiết kế và xuất bản một ứng dụng di động.', 
        'Trở thành lập trình viên App Di Động với React Native trong 3 tháng.', 
        1500000, 
        cat_it, 
        'https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=800&q=80',
        'published', 
        4.8, 
        120, 
        'beginner', 
        'Vietnamese'
      );
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.courses WHERE title = 'Thiết kế UI/UX Thực Chiến cùng Figma') THEN
      INSERT INTO public.courses (instructor_id, title, description, short_description, price, category_id, thumbnail_url, status, rating, total_enrollments, level, language)
      VALUES (
        instructor1_id, 
        'Thiết kế UI/UX Thực Chiến cùng Figma', 
        'Nắm bắt tư duy thiết kế, hệ thống design system chuẩn Apple/Google. Hướng dẫn sử dụng Figma để làm việc nhóm tạo ra Prototype mượt mà.', 
        'Nắm trọn tư duy hệ thống giao diện chuẩn UI/UX quốc tế.', 
        990000, 
        cat_design, 
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
        'published', 
        4.9, 
        300, 
        'intermediate', 
        'Vietnamese'
      );
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.courses WHERE title = 'Tiếng Hàn giao tiếp cơ bản (TOPIK 1)') THEN
      INSERT INTO public.courses (instructor_id, title, description, short_description, price, category_id, thumbnail_url, status, rating, total_enrollments, level, language)
      VALUES (
        instructor1_id, 
        'Tiếng Hàn giao tiếp cơ bản (TOPIK 1)', 
        'Học bảng chữ cái Hangeul và các cấu trúc giao tiếp thông dụng hàng ngày dành cho người mới bắt đầu.', 
        'Giao tiếp tiếng Hàn cấp tốc cho người đi làm.', 
        800000, 
        cat_lang, 
        'https://images.unsplash.com/photo-1596707328515-37326b9aeb6e?auto=format&fit=crop&w=800&q=80',
        'published', 
        4.7, 
        450, 
        'beginner', 
        'Vietnamese'
      );
    END IF;

  END IF;

  -- Instructor 2's Courses
  IF EXISTS(SELECT 1 FROM public.users WHERE id = instructor2_id AND role = 'instructor') THEN

    IF NOT EXISTS(SELECT 1 FROM public.courses WHERE title = 'Nghệ thuật x2 Doanh Số với TikTok Ads') THEN
      INSERT INTO public.courses (instructor_id, title, description, short_description, price, category_id, thumbnail_url, status, rating, total_enrollments, level, language)
      VALUES (
        instructor2_id, 
        'Nghệ thuật x2 Doanh Số với TikTok Ads', 
        'Hướng dẫn tư duy lên content video triệu view, setup chạy chiến dịch quảng cáo TikTok chuyển đổi cao ra đơn trực tiếp.', 
        'Bùng nổ doanh số với mỏ vàng TikTok Shop.', 
        2500000, 
        cat_mkt, 
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        'published', 
        5.0, 
        980, 
        'intermediate', 
        'Vietnamese'
      );
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.courses WHERE title = 'Khởi nghiệp tinh gọn cho Founder') THEN
      INSERT INTO public.courses (instructor_id, title, description, short_description, price, category_id, thumbnail_url, status, rating, total_enrollments, level, language)
      VALUES (
        instructor2_id, 
        'Khởi nghiệp tinh gọn cho Founder', 
        'Khóa học Lean Startup - Cách định hình mô hình kinh doanh, gọi vốn và tổ chức quy trình quản trị dự án tinh gọn hiệu quả.', 
        'Bí kíp sống còn cho Founder khi khởi nghiệp.', 
        2100000, 
        cat_biz, 
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
        'draft', -- Keep one draft as example
        0.0, 
        0, 
        'advanced', 
        'Vietnamese'
      );
    END IF;

  END IF;
END $$;
