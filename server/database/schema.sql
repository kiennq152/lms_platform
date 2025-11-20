-- =====================================================
-- VIAN Academy LMS Database Schema
-- Database: PostgreSQL (compatible with MySQL with minor modifications)
-- Version: 1.0
-- Date: 2024-01-20
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS forum_replies CASCADE;
DROP TABLE IF EXISTS forum_topics CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    social_link VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP,
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_status ON users(status);

-- =====================================================
-- 2. CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slug ON categories(slug);
CREATE INDEX idx_parent ON categories(parent_category_id);

-- =====================================================
-- 3. COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    thumbnail_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published')),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_enrollments INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    duration_hours DECIMAL(5, 2) DEFAULT 0,
    level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_instructor ON courses(instructor_id);
CREATE INDEX idx_category ON courses(category_id);
CREATE INDEX idx_status_courses ON courses(status);
CREATE INDEX idx_price ON courses(price);
CREATE INDEX idx_rating ON courses(rating);

-- =====================================================
-- 4. MODULES TABLE
-- =====================================================
CREATE TABLE modules (
    module_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_course_modules ON modules(course_id);
CREATE INDEX idx_order_modules ON modules(order_index);

-- =====================================================
-- 5. LESSONS TABLE
-- =====================================================
CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text', 'quiz', 'assignment')),
    video_url TEXT,
    youtube_url TEXT,
    video_duration INTEGER DEFAULT 0,
    content_text TEXT,
    content_data JSONB,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_module_lessons ON lessons(module_id);
CREATE INDEX idx_order_lessons ON lessons(order_index);
CREATE INDEX idx_content_type ON lessons(content_type);

-- =====================================================
-- 6. ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (student_id, course_id)
);

CREATE INDEX idx_student_enrollments ON enrollments(student_id);
CREATE INDEX idx_course_enrollments ON enrollments(course_id);
CREATE INDEX idx_status_enrollments ON enrollments(status);

-- =====================================================
-- 7. LESSON PROGRESS TABLE
-- =====================================================
CREATE TABLE lesson_progress (
    progress_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    watch_time_seconds INTEGER DEFAULT 0,
    completion_date TIMESTAMP,
    last_position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (enrollment_id, lesson_id)
);

CREATE INDEX idx_enrollment_progress ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress ON lesson_progress(lesson_id);
CREATE INDEX idx_completed_progress ON lesson_progress(is_completed);

-- =====================================================
-- 8. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'paypal', 'bank_transfer')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_gateway_transaction_id VARCHAR(255),
    coupon_code VARCHAR(50),
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_transactions ON transactions(student_id);
CREATE INDEX idx_course_transactions ON transactions(course_id);
CREATE INDEX idx_status_transactions ON transactions(payment_status);
CREATE INDEX idx_date_transactions ON transactions(transaction_date);

-- =====================================================
-- 9. COUPONS TABLE
-- =====================================================
CREATE TABLE coupons (
    coupon_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (valid_until > valid_from)
);

CREATE INDEX idx_code_coupons ON coupons(code);
CREATE INDEX idx_active_coupons ON coupons(is_active);
CREATE INDEX idx_validity_coupons ON coupons(valid_from, valid_until);

-- =====================================================
-- 10. CERTIFICATES TABLE
-- =====================================================
CREATE TABLE certificates (
    certificate_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL UNIQUE REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_certificates ON certificates(student_id);
CREATE INDEX idx_course_certificates ON certificates(course_id);
CREATE INDEX idx_number_certificates ON certificates(certificate_number);

-- =====================================================
-- 11. REVIEWS TABLE
-- =====================================================
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (course_id, student_id)
);

CREATE INDEX idx_course_reviews ON reviews(course_id);
CREATE INDEX idx_student_reviews ON reviews(student_id);
CREATE INDEX idx_rating_reviews ON reviews(rating);
CREATE INDEX idx_approved_reviews ON reviews(is_approved);

-- =====================================================
-- 12. FORUM TOPICS TABLE
-- =====================================================
CREATE TABLE forum_topics (
    topic_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_course_topics ON forum_topics(course_id);
CREATE INDEX idx_author_topics ON forum_topics(author_id);
CREATE INDEX idx_pinned_topics ON forum_topics(is_pinned);
CREATE INDEX idx_created_topics ON forum_topics(created_at);

-- =====================================================
-- 13. FORUM REPLIES TABLE
-- =====================================================
CREATE TABLE forum_replies (
    reply_id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(topic_id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topic_replies ON forum_replies(topic_id);
CREATE INDEX idx_author_replies ON forum_replies(author_id);
CREATE INDEX idx_solution_replies ON forum_replies(is_solution);
CREATE INDEX idx_created_replies ON forum_replies(created_at);

-- =====================================================
-- 14. SYSTEM LOGS TABLE
-- =====================================================
CREATE TABLE system_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'success')),
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('user', 'system', 'security', 'payment')),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_logs ON system_logs(user_id);
CREATE INDEX idx_level_logs ON system_logs(log_level);
CREATE INDEX idx_type_logs ON system_logs(log_type);
CREATE INDEX idx_created_logs ON system_logs(created_at);

-- =====================================================
-- 15. SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_key_settings ON settings(setting_key);

-- =====================================================
-- 16. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_notifications ON notifications(user_id);
CREATE INDEX idx_read_notifications ON notifications(is_read);
CREATE INDEX idx_created_notifications ON notifications(created_at);

-- =====================================================
-- 17. EMAIL VERIFICATION TOKENS TABLE
-- =====================================================
CREATE TABLE email_verification_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_verification ON email_verification_tokens(token);
CREATE INDEX idx_user_verification ON email_verification_tokens(user_id);
CREATE INDEX idx_expires_verification ON email_verification_tokens(expires_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_topics_updated_at BEFORE UPDATE ON forum_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update course enrollment count
CREATE OR REPLACE FUNCTION update_course_enrollments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET total_enrollments = (
        SELECT COUNT(*) 
        FROM enrollments 
        WHERE course_id = NEW.course_id AND status = 'active'
    )
    WHERE course_id = NEW.course_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollment_count AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_course_enrollments();

-- Function to update course rating
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews 
        WHERE course_id = NEW.course_id AND is_approved = TRUE
    )
    WHERE course_id = NEW.course_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rating AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- Function to update forum topic reply count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE forum_topics 
    SET reply_count = (
        SELECT COUNT(*) 
        FROM forum_replies 
        WHERE topic_id = NEW.topic_id
    )
    WHERE topic_id = NEW.topic_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_topic_reply_count AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- Function to update course total lessons
CREATE OR REPLACE FUNCTION update_course_lessons()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET total_lessons = (
        SELECT COUNT(*) 
        FROM lessons l
        JOIN modules m ON l.module_id = m.module_id
        WHERE m.course_id = (
            SELECT course_id FROM modules WHERE module_id = NEW.module_id
        )
    )
    WHERE course_id = (SELECT course_id FROM modules WHERE module_id = NEW.module_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lesson_count AFTER INSERT OR DELETE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_course_lessons();

-- =====================================================
-- INITIAL DATA (OPTIONAL)
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

