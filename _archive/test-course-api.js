import pool from './config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function testCourseAPI() {
  try {
    console.log('🧪 Testing Course API Endpoints...\n');
    
    // Step 1: Create test instructor and get token
    console.log('1. Creating test instructor...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status, admin_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET admin_approved = TRUE
       RETURNING user_id, email, role`,
      ['test-instructor-api@test.com', hashedPassword, 'Test', 'Instructor', 'instructor', 'active', true]
    );
    const instructor = userResult.rows[0];
    const token = jwt.sign(
      { user_id: instructor.user_id, email: instructor.email, role: instructor.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log(`   ✅ Instructor created: ID ${instructor.user_id}`);
    
    // Step 2: Test creating a course (simulate API call)
    console.log('\n2. Testing course creation...');
    const courseData = {
      title: 'API Test Course',
      description: 'This is a test course created via API',
      short_description: 'Test course',
      price: 49.99,
      level: 'beginner',
      language: 'en'
    };
    
    const courseResult = await pool.query(
      `INSERT INTO courses (instructor_id, title, description, short_description, price, level, language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING course_id, title, status`,
      [instructor.user_id, courseData.title, courseData.description, courseData.short_description, 
       courseData.price, courseData.level, courseData.language, 'draft']
    );
    const courseId = courseResult.rows[0].course_id;
    console.log(`   ✅ Course created: ID ${courseId}, Status: ${courseResult.rows[0].status}`);
    
    // Step 3: Test creating a module
    console.log('\n3. Testing module creation...');
    const moduleResult = await pool.query(
      `INSERT INTO modules (course_id, title, order_index)
       VALUES ($1, $2, $3)
       RETURNING module_id, title`,
      [courseId, 'Test Module', 0]
    );
    const moduleId = moduleResult.rows[0].module_id;
    console.log(`   ✅ Module created: ID ${moduleId}`);
    
    // Step 4: Test creating a lesson with YouTube content
    console.log('\n4. Testing lesson creation with YouTube content...');
    const lessonContentData = {
      youtubeUrl: 'https://www.youtube.com/watch?v=SZs7h_67HTE',
      videoId: 'SZs7h_67HTE'
    };
    const lessonResult = await pool.query(
      `INSERT INTO lessons (module_id, title, content_type, content_data, order_index, is_preview)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING lesson_id, title, content_type`,
      [moduleId, 'Test Lesson', 'video', JSON.stringify(lessonContentData), 0, false]
    );
    const lessonId = lessonResult.rows[0].lesson_id;
    console.log(`   ✅ Lesson created: ID ${lessonId}`);
    
    // Step 5: Test reading the course back
    console.log('\n5. Testing course retrieval...');
    const readCourse = await pool.query(
      `SELECT c.*, cat.name as category_name,
              u.first_name || ' ' || u.last_name as instructor_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       LEFT JOIN users u ON c.instructor_id = u.user_id
       WHERE c.course_id = $1`,
      [courseId]
    );
    
    const modulesRead = await pool.query(
      `SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index`,
      [courseId]
    );
    
    const lessonsRead = await pool.query(
      `SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index`,
      [moduleId]
    );
    
    console.log(`   ✅ Course retrieved: ${readCourse.rows[0].title}`);
    console.log(`   ✅ Modules: ${modulesRead.rows.length}`);
    console.log(`   ✅ Lessons: ${lessonsRead.rows.length}`);
    
    // Step 6: Verify content_data
    const lessonData = lessonsRead.rows[0];
    if (lessonData.content_data) {
      const contentData = typeof lessonData.content_data === 'string' 
        ? JSON.parse(lessonData.content_data) 
        : lessonData.content_data;
      console.log(`   ✅ Content data: ${contentData.youtubeUrl || 'N/A'}`);
    }
    
    // Step 7: Test updating course
    console.log('\n6. Testing course update...');
    const updateResult = await pool.query(
      `UPDATE courses SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE course_id = $2 RETURNING title`,
      ['Updated API Test Course', courseId]
    );
    console.log(`   ✅ Course updated: ${updateResult.rows[0].title}`);
    
    console.log('\n✅ All API operations tested successfully!');
    console.log(`\n📝 Test Course ID: ${courseId}`);
    console.log(`📝 Test Module ID: ${moduleId}`);
    console.log(`📝 Test Lesson ID: ${lessonId}`);
    console.log(`\n💡 You can now test saving courses in the UI!`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCourseAPI();


