-- =====================================================
-- VIAN Academy LMS - Sample Data Initialization
-- This file contains sample data for development/testing
-- =====================================================

-- =====================================================
-- SAMPLE USERS
-- =====================================================

-- Insert sample instructors
INSERT INTO users (email, password_hash, first_name, last_name, role, status, bio) VALUES
('jane.smith@example.com', '$2b$10$samplehash1', 'Jane', 'Smith', 'instructor', 'active', 'Experienced web developer with 10+ years in the industry'),
('sarah.williams@example.com', '$2b$10$samplehash2', 'Sarah', 'Williams', 'instructor', 'active', 'Data science expert and machine learning specialist'),
('john.doe@example.com', '$2b$10$samplehash3', 'John', 'Doe', 'instructor', 'active', 'Full-stack developer and educator');

-- Insert sample students
INSERT INTO users (email, password_hash, first_name, last_name, role, status) VALUES
('student1@example.com', '$2b$10$samplehash4', 'Alice', 'Johnson', 'student', 'active'),
('student2@example.com', '$2b$10$samplehash5', 'Bob', 'Brown', 'student', 'active'),
('student3@example.com', '$2b$10$samplehash6', 'Charlie', 'Davis', 'student', 'active');

-- =====================================================
-- SAMPLE COURSES
-- =====================================================

-- Get instructor IDs (assuming they were inserted above)
SET @instructor1 = (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
SET @instructor2 = (SELECT user_id FROM users WHERE email = 'sarah.williams@example.com');
SET @category1 = (SELECT category_id FROM categories WHERE slug = 'web-development');
SET @category2 = (SELECT category_id FROM categories WHERE slug = 'data-science');

-- Insert sample courses
INSERT INTO courses (instructor_id, title, description, short_description, price, category_id, status, level, language, published_at) VALUES
(@instructor1, 'Complete Web Development Bootcamp', 
 'Learn web development from scratch. Master HTML, CSS, JavaScript, React, Node.js, and more.',
 'Master modern web development technologies',
 99.99, @category1, 'published', 'beginner', 'English', NOW()),
 
(@instructor1, 'Advanced React Patterns', 
 'Deep dive into advanced React patterns, hooks, and performance optimization.',
 'Advanced React development techniques',
 79.99, @category1, 'published', 'advanced', 'English', NOW()),
 
(@instructor2, 'Python for Data Science', 
 'Learn Python programming for data analysis, visualization, and machine learning.',
 'Data science with Python',
 89.99, @category2, 'published', 'intermediate', 'English', NOW()),
 
(@instructor2, 'Machine Learning Fundamentals', 
 'Introduction to machine learning algorithms and their applications.',
 'ML basics and applications',
 119.99, @category2, 'published', 'intermediate', 'English', NOW());

-- =====================================================
-- SAMPLE MODULES AND LESSONS
-- =====================================================

-- Get course IDs
SET @course1 = (SELECT course_id FROM courses WHERE title = 'Complete Web Development Bootcamp' LIMIT 1);

-- Insert modules for course 1
INSERT INTO modules (course_id, title, description, order_index) VALUES
(@course1, 'Introduction to Web Development', 'Get started with web development basics', 1),
(@course1, 'HTML and CSS Fundamentals', 'Learn HTML and CSS from scratch', 2),
(@course1, 'JavaScript Basics', 'Master JavaScript fundamentals', 3);

-- Get module IDs
SET @module1 = (SELECT module_id FROM modules WHERE course_id = @course1 AND order_index = 1 LIMIT 1);

-- Insert lessons for module 1
INSERT INTO lessons (module_id, title, description, content_type, video_url, video_duration, order_index, is_preview) VALUES
(@module1, 'Welcome to the Course', 'Introduction to web development', 'video', 'https://example.com/video1.mp4', 300, 1, TRUE),
(@module1, 'Setting Up Your Environment', 'Install and configure development tools', 'video', 'https://example.com/video2.mp4', 600, 2, FALSE),
(@module1, 'Your First Web Page', 'Create your first HTML page', 'video', 'https://example.com/video3.mp4', 450, 3, FALSE);

-- =====================================================
-- SAMPLE ENROLLMENTS
-- =====================================================

SET @student1 = (SELECT user_id FROM users WHERE email = 'student1@example.com');
SET @student2 = (SELECT user_id FROM users WHERE email = 'student2@example.com');

-- Enroll students in courses
INSERT INTO enrollments (student_id, course_id, enrollment_date, progress_percentage, status) VALUES
(@student1, @course1, CURRENT_DATE, 25.50, 'active'),
(@student2, @course1, CURRENT_DATE, 10.00, 'active');

-- =====================================================
-- SAMPLE TRANSACTIONS
-- =====================================================

INSERT INTO transactions (student_id, course_id, amount, currency, payment_method, payment_status, transaction_date) VALUES
(@student1, @course1, 99.99, 'USD', 'credit_card', 'completed', NOW()),
(@student2, @course1, 99.99, 'USD', 'paypal', 'completed', NOW());

-- =====================================================
-- SAMPLE COUPONS
-- =====================================================

INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_uses, valid_from, valid_until, is_active) VALUES
('WELCOME10', 'percentage', 10.00, 0.00, 100, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), TRUE),
('SAVE50', 'fixed_amount', 50.00, 100.00, 50, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), TRUE);

-- =====================================================
-- SAMPLE REVIEWS
-- =====================================================

INSERT INTO reviews (course_id, student_id, rating, comment, is_approved) VALUES
(@course1, @student1, 5, 'Excellent course! Very comprehensive and well-structured.', TRUE),
(@course1, @student2, 4, 'Great content, but could use more examples.', TRUE);

-- =====================================================
-- SAMPLE FORUM TOPICS
-- =====================================================

INSERT INTO forum_topics (course_id, author_id, title, content) VALUES
(@course1, @student1, 'How to install Node.js?', 'I am having trouble installing Node.js. Can someone help?'),
(@course1, @student2, 'Best practices for React hooks', 'What are some best practices when using React hooks?');

-- =====================================================
-- SAMPLE NOTIFICATIONS
-- =====================================================

INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
(@student1, 'course', 'New Lesson Available', 'A new lesson has been added to your enrolled course', FALSE),
(@student1, 'payment', 'Payment Successful', 'Your payment for Complete Web Development Bootcamp has been processed', TRUE);

-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================

-- Note: This is sample data for development/testing purposes only.
-- In production, use proper password hashing and remove this file or secure it.

