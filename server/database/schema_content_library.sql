-- Content Library Table for storing instructor content
-- This table stores YouTube links, documents, exercises, and other content

CREATE TABLE IF NOT EXISTS content_library (
    content_id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'document', 'exercise', 'image')),
    content_data JSONB, -- Stores flexible content data (YouTube URL, file info, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_instructor (instructor_id),
    INDEX idx_course (course_id),
    INDEX idx_type (content_type)
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_library_updated_at
    BEFORE UPDATE ON content_library
    FOR EACH ROW
    EXECUTE FUNCTION update_content_library_updated_at();

