# LMS API Documentation

## Setup Instructions

### 1. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE lms_db;
```

2. Run schema files:
```bash
psql -U postgres -d lms_db -f database/schema.sql
psql -U postgres -d lms_db -f database/schema_content_library.sql
psql -U postgres -d lms_db -f database/init.sql
```

### 2. Environment Configuration

Create `.env` file in `server/` directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=5173
NODE_ENV=development
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Start Server

```bash
npm run dev
```

Server will run on `http://localhost:5173`

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with token
- `GET /api/auth/me` - Get current user

### Courses (`/api/courses`)

- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get single course with modules/lessons
- `POST /api/courses` - Create course (instructor/admin)
- `PUT /api/courses/:id` - Update course (instructor/admin)
- `DELETE /api/courses/:id` - Delete course (instructor/admin)
- `POST /api/courses/:courseId/modules` - Create/update module
- `POST /api/courses/:courseId/lessons` - Create/update lesson

### Enrollments (`/api/enrollments`)

- `GET /api/enrollments` - Get enrollments (role-based)
- `POST /api/enrollments` - Enroll in course (student)
- `PUT /api/enrollments/:id/progress` - Update progress

### Instructor (`/api/instructor`)

- `GET /api/instructor/dashboard/stats` - Get dashboard statistics
- `GET /api/instructor/courses` - Get instructor courses
- `GET /api/instructor/students` - Get instructor students
- `GET /api/instructor/analytics` - Get analytics data

### Content Library (`/api/content`)

- `GET /api/content` - Get content library (instructor)
- `POST /api/content` - Add content (instructor)
- `DELETE /api/content/:id` - Delete content (instructor)

### Users (`/api/users`)

- `GET /api/users` - Get all users (admin)
- `POST /api/users/:id/approve` - Approve instructor (admin)
- `PUT /api/users/:id/status` - Update user status (admin)

## Client-Side API Usage

The API service is available globally as `api` or can be imported:

```javascript
// Login
const response = await api.login(email, password);

// Get courses
const { courses } = await api.getCourses({ status: 'published' });

// Create course
const course = await api.createCourse({
  title: 'My Course',
  description: 'Course description',
  price: 99.99
});

// Get instructor stats
const stats = await api.getInstructorStats();
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The token is automatically included when using the `api` service after login.

## Database Schema

See `database/schema.sql` for the complete database schema including:
- Users (with email verification and admin approval)
- Courses, Modules, Lessons
- Enrollments
- Reviews, Certificates
- Transactions, Coupons
- Forum Topics/Replies
- Content Library

## Migration from localStorage

The client pages have been updated to use the API instead of localStorage. The API service (`client/js/api.js`) handles all communication with the server.

