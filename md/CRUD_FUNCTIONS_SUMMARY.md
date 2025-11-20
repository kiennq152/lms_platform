# CRUD Functions Summary

## Overview
This document summarizes all CRUD (Create, Read, Update, Delete) operations available in the LMS system for Courses, Users (Instructors/Students), and Enrollments.

---

## 1. COURSES CRUD

### ✅ Complete Implementation

| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| **List** | `/api/courses` | GET | Public | Get all courses (with filters: status, category, search, instructor_id) |
| **Read** | `/api/courses/:id` | GET | Public | Get single course with modules and lessons |
| **Create** | `/api/courses` | POST | Instructor/Admin | Create new course (status: 'pending' by default) |
| **Update** | `/api/courses/:id` | PUT | Instructor/Admin | Update course (instructor can only update own courses) |
| **Delete** | `/api/courses/:id` | DELETE | Instructor/Admin | Delete course (instructor can only delete own courses) |

### Module & Lesson Management
| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| **Create/Update Module** | `/api/courses/:courseId/modules` | POST | Instructor/Admin | Create or update module (use `module_id` for update) |
| **Create/Update Lesson** | `/api/courses/:courseId/lessons` | POST | Instructor/Admin | Create or update lesson (use `lesson_id` for update) |

### Client-Side API Methods (`client/js/api.js`)
```javascript
api.getCourses(params)           // List courses
api.getCourse(id)                // Get single course
api.createCourse(courseData)      // Create course
api.updateCourse(id, courseData)  // Update course
api.deleteCourse(id)              // Delete course
api.createModule(courseId, moduleData)
api.updateModule(courseId, moduleId, moduleData)
api.createLesson(courseId, lessonData)
api.updateLesson(courseId, lessonId, lessonData)
```

---

## 2. USERS CRUD (Instructors & Students)

### ✅ Complete Implementation

| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| **List** | `/api/users` | GET | Admin | Get all users (excludes 'admin' and 'guest' accounts) |
| **Read** | `/api/users/me` | GET | Authenticated | Get current user profile |
| **Update** | `/api/users/me` | PUT | Authenticated | Update own profile (first_name, last_name, phone, bio, etc.) |
| **Approve** | `/api/users/:id/approve` | POST | Admin | Approve user (sets admin_approved = true) |
| **Reject** | `/api/users/:id/reject` | POST | Admin | Reject user (sets admin_approved = false) |
| **Update Status** | `/api/users/:id/status` | PUT | Admin | Update user status (active/inactive/suspended) |
| **Delete** | `/api/users/:id` | DELETE | Admin | Soft delete user (sets status to 'inactive') ⭐ NEW |

### Notes:
- **Delete Operation**: Soft delete only (sets status to 'inactive') to preserve data integrity
- **Admin/Guest Protection**: Cannot delete 'admin' or 'guest' accounts
- **Ownership**: Users can only update their own profile via `/users/me`

### Client-Side API Methods (`client/js/api.js`)
```javascript
api.getUsers(params)        // List users (admin)
api.getCurrentUser()        // Get current user profile
api.updateProfile(data)     // Update own profile
api.approveUser(userId)     // Approve user (admin)
api.rejectUser(userId)      // Reject user (admin)
api.deleteUser(userId)      // Delete user (admin) ⭐ NEW
```

---

## 3. ENROLLMENTS CRUD (Student Course Enrollment)

### ✅ Complete Implementation

| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| **List** | `/api/enrollments` | GET | Authenticated | Get enrollments (student sees own, instructor sees course enrollments, admin sees all) |
| **Create** | `/api/enrollments` | POST | Student | Enroll in course (requires course to be 'published') |
| **Update** | `/api/enrollments/:id/progress` | PUT | Authenticated | Update enrollment progress (student can update own, admin can update any) |
| **Delete** | `/api/enrollments/:id` | DELETE | Authenticated | Unenroll from course (student can delete own, admin can delete any) ⭐ NEW |
| **Delete by Course** | `/api/enrollments/course/:courseId` | DELETE | Student | Unenroll from course by course ID ⭐ NEW |

### Notes:
- **Enrollment Validation**: 
  - Course must exist and be 'published'
  - Cannot enroll twice in the same course
  - Student can only enroll in courses (not instructors)
- **Unenrollment**: 
  - Students can unenroll from their own courses
  - Admins can unenroll any student
  - Two endpoints: by enrollment_id or by course_id

### Client-Side API Methods (`client/js/api.js`)
```javascript
api.getEnrollments()                    // List enrollments
api.enrollInCourse(courseId)            // Enroll in course
api.updateProgress(enrollmentId, data) // Update progress
api.unenrollFromCourse(enrollmentId)    // Unenroll by enrollment ID ⭐ NEW
api.unenrollByCourseId(courseId)        // Unenroll by course ID ⭐ NEW
```

---

## 4. INSTRUCTOR COURSE MANAGEMENT

### ✅ Complete Implementation

Instructors can manage their courses through the courses CRUD endpoints with ownership checks:

| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| **Dashboard Stats** | `/api/instructor/dashboard/stats` | GET | Instructor | Get instructor dashboard statistics |
| **My Courses** | `/api/instructor/courses` | GET | Instructor | Get instructor's courses (with optional status filter) |
| **My Students** | `/api/instructor/students` | GET | Instructor | Get students enrolled in instructor's courses |
| **Analytics** | `/api/instructor/analytics` | GET | Instructor | Get instructor analytics (with optional period filter) |

### Ownership Validation:
- All course CRUD operations check `instructor_id` matches `req.user.user_id`
- Instructors can only modify their own courses
- Admins can modify any course

### Client-Side API Methods (`client/js/api.js`)
```javascript
api.getInstructorStats()              // Dashboard stats
api.getInstructorCourses(status)      // Get instructor's courses
api.getInstructorStudents(courseId)    // Get instructor's students
api.getInstructorAnalytics(period)    // Get analytics
```

---

## 5. AUTHORIZATION & PERMISSIONS

### Role-Based Access Control:

| Role | Courses | Users | Enrollments | Notes |
|------|---------|-------|-------------|-------|
| **Public** | ✅ Read (published only) | ❌ | ❌ | Can view published courses |
| **Student** | ✅ Read | ✅ Own profile | ✅ Own enrollments | Can enroll/unenroll in courses |
| **Instructor** | ✅ CRUD (own courses) | ✅ Own profile | ✅ Read (own course enrollments) | Can manage own courses and see students |
| **Admin** | ✅ CRUD (all courses) | ✅ CRUD (all users) | ✅ CRUD (all enrollments) | Full access |

---

## 6. NEW FEATURES ADDED

### ⭐ Recently Added Endpoints:

1. **DELETE `/api/enrollments/:id`**
   - Allows students to unenroll from courses
   - Admins can unenroll any student
   - Validates ownership before deletion

2. **DELETE `/api/enrollments/course/:courseId`**
   - Convenience endpoint for students
   - Unenrolls by course ID instead of enrollment ID
   - Automatically finds enrollment for current user

3. **DELETE `/api/users/:id`**
   - Admin-only endpoint to delete users
   - Soft delete (sets status to 'inactive')
   - Protects admin/guest accounts

### Client-Side Methods Added:
- `api.unenrollFromCourse(enrollmentId)`
- `api.unenrollByCourseId(courseId)`
- `api.deleteUser(userId)`

---

## 7. TESTING CHECKLIST

### Courses:
- [ ] Create course as instructor
- [ ] Update course (own and other's - should fail)
- [ ] Delete course (own and other's - should fail)
- [ ] Add modules and lessons
- [ ] Update modules and lessons

### Users:
- [ ] Get user list (admin only)
- [ ] Update own profile
- [ ] Approve/reject user (admin)
- [ ] Delete user (admin, should soft delete)
- [ ] Try to delete admin/guest (should fail)

### Enrollments:
- [ ] Enroll in course as student
- [ ] Try to enroll twice (should fail)
- [ ] Update progress
- [ ] Unenroll by enrollment ID
- [ ] Unenroll by course ID
- [ ] Try to unenroll from other's enrollment (should fail)

---

## 8. FILES MODIFIED

1. **`server/routes/enrollments.js`**
   - Added `DELETE /:id` endpoint
   - Added `DELETE /course/:courseId` endpoint

2. **`server/routes/users.js`**
   - Added `DELETE /:id` endpoint (soft delete)

3. **`client/js/api.js`**
   - Added `unenrollFromCourse()` method
   - Added `unenrollByCourseId()` method
   - Added `deleteUser()` method

---

## Summary

✅ **All CRUD operations are now complete!**

- **Courses**: Full CRUD + Module/Lesson management
- **Users**: Full CRUD + Approval workflow
- **Enrollments**: Full CRUD + Progress tracking
- **Instructor Management**: Complete dashboard and analytics

All endpoints include proper authentication, authorization, and ownership validation.

