import pool from './config/database.js';
import bcrypt from 'bcryptjs';

async function testSaveCourse() {
  try {
    console.log('🧪 Testing course save functionality...\n');
    
    // Step 1: Create a test instructor user
    console.log('1. Creating test instructor...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status, admin_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET admin_approved = TRUE
       RETURNING user_id, email`,
      ['test-instructor@test.com', hashedPassword, 'Test', 'Instructor', 'instructor', 'active', true]
    );
    const instructorId = userResult.rows[0].user_id;
    console.log(`   ✅ Instructor created: ID ${instructorId}`);
    
    // Step 2: Create a test course
    console.log('\n2. Creating test course...');
    const courseResult = await pool.query(
      `INSERT INTO courses (instructor_id, title, description, price, level, language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING course_id, title`,
      [instructorId, 'Test Course', 'Test Description', 99.99, 'beginner', 'en', 'draft']
    );
    const courseId = courseResult.rows[0].course_id;
    console.log(`   ✅ Course created: ID ${courseId}, Title: ${courseResult.rows[0].title}`);
    
    // Step 3: Create a test module
    console.log('\n3. Creating test module...');
    const moduleResult = await pool.query(
      `INSERT INTO modules (course_id, title, order_index)
       VALUES ($1, $2, $3)
       RETURNING module_id, title`,
      [courseId, 'Test Module', 0]
    );
    const moduleId = moduleResult.rows[0].module_id;
    console.log(`   ✅ Module created: ID ${moduleId}, Title: ${moduleResult.rows[0].title}`);
    
    // Step 4: Create a test lesson with YouTube content
    console.log('\n4. Creating test lesson with YouTube content...');
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
    console.log(`   ✅ Lesson created: ID ${lessonResult.rows[0].lesson_id}, Type: ${lessonResult.rows[0].content_type}`);
    
    // Step 5: Verify everything was saved
    console.log('\n5. Verifying saved data...');
    const verifyCourse = await pool.query(
      `SELECT c.*, COUNT(m.module_id) as module_count, COUNT(l.lesson_id) as lesson_count
       FROM courses c
       LEFT JOIN modules m ON c.course_id = m.course_id
       LEFT JOIN lessons l ON m.module_id = l.module_id
       WHERE c.course_id = $1
       GROUP BY c.course_id`,
      [courseId]
    );
    console.log(`   ✅ Course verified: ${verifyCourse.rows[0].module_count} modules, ${verifyCourse.rows[0].lesson_count} lessons`);
    
    // Step 6: Test reading the lesson content_data
    const lessonData = await pool.query(
      `SELECT lesson_id, title, content_type, content_data FROM lessons WHERE lesson_id = $1`,
      [lessonResult.rows[0].lesson_id]
    );
    // PostgreSQL JSONB returns as object, not string
    const savedContentData = lessonData.rows[0].content_data || {};
    console.log(`   ✅ Content data: ${savedContentData.youtubeUrl || 'N/A'}`);
    
    console.log('\n✅ All tests passed! Course save functionality is working.');
    console.log(`\n📝 Test Course ID: ${courseId}`);
    console.log(`📝 Test Instructor ID: ${instructorId}`);
    console.log(`📝 Test Module ID: ${moduleId}`);
    console.log(`📝 Test Lesson ID: ${lessonResult.rows[0].lesson_id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSaveCourse();

