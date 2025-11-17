-- =====================================================
-- VIAN Academy LMS Database Schema (MySQL Version)
-- Database: MySQL 8.0+
-- Version: 1.0
-- Date: 2024-01-20
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS forum_replies;
DROP TABLE IF EXISTS forum_topics;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_category_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    category_id INT NULL,
    thumbnail_url TEXT,
    status ENUM('draft', 'pending', 'approved', 'rejected', 'published') NOT NULL DEFAULT 'draft',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_enrollments INT DEFAULT 0,
    total_lessons INT DEFAULT 0,
    duration_hours DECIMAL(5, 2) DEFAULT 0,
    level ENUM('beginner', 'intermediate', 'advanced') NULL,
    language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_instructor (instructor_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_rating (rating),
    CHECK (price >= 0),
    CHECK (rating >= 0 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. MODULES TABLE
-- =====================================================
CREATE TABLE modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. LESSONS TABLE
-- =====================================================
CREATE TABLE lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type ENUM('video', 'text', 'quiz', 'assignment') NOT NULL,
    video_url TEXT,
    video_duration INT DEFAULT 0,
    content_text TEXT,
    order_index INT NOT NULL DEFAULT 0,
    is_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE,
    INDEX idx_module (module_id),
    INDEX idx_order (order_index),
    INDEX idx_content_type (content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    completion_date DATE NULL,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
    status ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active',
    last_accessed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student (student_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status),
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. LESSON PROGRESS TABLE
-- =====================================================
CREATE TABLE lesson_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    lesson_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    watch_time_seconds INT DEFAULT 0,
    completion_date TIMESTAMP NULL,
    last_position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (enrollment_id, lesson_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_lesson (lesson_id),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method ENUM('credit_card', 'paypal', 'bank_transfer') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_gateway_transaction_id VARCHAR(255),
    coupon_code VARCHAR(50) NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_course (course_id),
    INDEX idx_status (payment_status),
    INDEX idx_date (transaction_date),
    CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. COUPONS TABLE
-- =====================================================
CREATE TABLE coupons (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_uses INT NULL,
    used_count INT DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_validity (valid_from, valid_until),
    CHECK (discount_value > 0),
    CHECK (valid_until > valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. CERTIFICATES TABLE
-- =====================================================
CREATE TABLE certificates (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_course (course_id),
    INDEX idx_number (certificate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. REVIEWS TABLE
-- =====================================================
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (course_id, student_id),
    INDEX idx_course (course_id),
    INDEX idx_student (student_id),
    INDEX idx_rating (rating),
    INDEX idx_approved (is_approved),
    CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. FORUM TOPICS TABLE
-- =====================================================
CREATE TABLE forum_topics (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NULL,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_author (author_id),
    INDEX idx_pinned (is_pinned),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. FORUM REPLIES TABLE
-- =====================================================
CREATE TABLE forum_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (topic_id) REFERENCES forum_topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_topic (topic_id),
    INDEX idx_author (author_id),
    INDEX idx_solution (is_solution),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. SYSTEM LOGS TABLE
-- =====================================================
CREATE TABLE system_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    log_level ENUM('info', 'warning', 'error', 'success') NOT NULL,
    log_type ENUM('user', 'system', 'security', 'payment') NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_level (log_level),
    INDEX idx_type (log_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STORED PROCEDURES FOR AUTOMATIC UPDATES
-- =====================================================

DELIMITER //

-- Procedure to update course enrollment count
CREATE PROCEDURE UpdateCourseEnrollments(IN p_course_id INT)
BEGIN
    UPDATE courses 
    SET total_enrollments = (
        SELECT COUNT(*) 
        FROM enrollments 
        WHERE course_id = p_course_id AND status = 'active'
    )
    WHERE course_id = p_course_id;
END //

-- Procedure to update course rating
CREATE PROCEDURE UpdateCourseRating(IN p_course_id INT)
BEGIN
    UPDATE courses 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews 
        WHERE course_id = p_course_id AND is_approved = TRUE
    )
    WHERE course_id = p_course_id;
END //

-- Procedure to update forum topic reply count
CREATE PROCEDURE UpdateReplyCount(IN p_topic_id INT)
BEGIN
    UPDATE forum_topics 
    SET reply_count = (
        SELECT COUNT(*) 
        FROM forum_replies 
        WHERE topic_id = p_topic_id
    )
    WHERE topic_id = p_topic_id;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

DELIMITER //

-- Trigger to update enrollment count
CREATE TRIGGER after_enrollment_insert
AFTER INSERT ON enrollments
FOR EACH ROW
BEGIN
    CALL UpdateCourseEnrollments(NEW.course_id);
END //

CREATE TRIGGER after_enrollment_update
AFTER UPDATE ON enrollments
FOR EACH ROW
BEGIN
    CALL UpdateCourseEnrollments(NEW.course_id);
END //

CREATE TRIGGER after_enrollment_delete
AFTER DELETE ON enrollments
FOR EACH ROW
BEGIN
    CALL UpdateCourseEnrollments(OLD.course_id);
END //

-- Trigger to update course rating
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    CALL UpdateCourseRating(NEW.course_id);
END //

CREATE TRIGGER after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    CALL UpdateCourseRating(NEW.course_id);
END //

CREATE TRIGGER after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    CALL UpdateCourseRating(OLD.course_id);
END //

-- Trigger to update reply count
CREATE TRIGGER after_reply_insert
AFTER INSERT ON forum_replies
FOR EACH ROW
BEGIN
    CALL UpdateReplyCount(NEW.topic_id);
END //

CREATE TRIGGER after_reply_delete
AFTER DELETE ON forum_replies
FOR EACH ROW
BEGIN
    CALL UpdateReplyCount(OLD.topic_id);
END //

DELIMITER ;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin user (password: admin123 - should be hashed in production)
-- Note: In production, use bcrypt to hash passwords
INSERT INTO users (email, password_hash, first_name, last_name, role, status) 
VALUES ('admin@vianacademy.com', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'admin', 'active');

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Web Development', 'web-development', 'Learn web development technologies'),
('Data Science', 'data-science', 'Data science and analytics courses'),
('Design', 'design', 'UI/UX and graphic design courses'),
('Business', 'business', 'Business and entrepreneurship courses'),
('Programming', 'programming', 'Programming languages and frameworks');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'VIAN Academy', 'string', 'Site name'),
('site_email', 'admin@vianacademy.com', 'string', 'Site contact email'),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode status'),
('session_timeout', '30', 'number', 'Session timeout in minutes'),
('max_login_attempts', '5', 'number', 'Maximum login attempts before lockout');

-- =====================================================
-- END OF SCHEMA
-- =====================================================

