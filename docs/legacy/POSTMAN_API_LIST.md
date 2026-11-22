# Postman API Collection - Complete List

## Base URL
```
http://localhost:5173/api
```

**Note:** For authenticated endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication APIs (`/api/auth`)

### 1. Register User
- **Method:** `POST`
- **Endpoint:** `/auth/register`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "phone": "+1234567890",
  "bio": "Optional bio"
}
```

### 2. Login
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Request OTP
- **Method:** `POST`
- **Endpoint:** `/auth/request-otp`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com"
}
```

### 4. Login with OTP
- **Method:** `POST`
- **Endpoint:** `/auth/login-otp`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 5. Verify Email
- **Method:** `POST`
- **Endpoint:** `/auth/verify-email`
- **Auth:** Public
- **Body:**
```json
{
  "token": "verification_token_here"
}
```

### 6. Verify Registration (OTP)
- **Method:** `POST`
- **Endpoint:** `/auth/verify-registration`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 7. Resend Verification Email
- **Method:** `POST`
- **Endpoint:** `/auth/resend-verification`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com"
}
```

### 8. Resend Registration OTP
- **Method:** `POST`
- **Endpoint:** `/auth/resend-registration-otp`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com"
}
```

### 9. Get Current User
- **Method:** `GET`
- **Endpoint:** `/auth/me`
- **Auth:** Required (Bearer Token)

---

## 👥 User Management APIs (`/api/users`)

### 10. List All Users (Admin)
- **Method:** `GET`
- **Endpoint:** `/users`
- **Auth:** Admin
- **Query Parameters:** Optional
  - `role`: Filter by role (student, instructor, admin)
  - `status`: Filter by status (active, inactive, pending)
  - `search`: Search by name or email

### 11. Get User by ID (Admin)
- **Method:** `GET`
- **Endpoint:** `/users/:id`
- **Auth:** Admin
- **URL Parameter:** `id` (user_id)

### 12. Get Own Profile
- **Method:** `GET`
- **Endpoint:** `/users/me`
- **Auth:** Required

### 13. Update Own Profile
- **Method:** `PUT`
- **Endpoint:** `/users/me`
- **Auth:** Required
- **Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Updated bio"
}
```

### 14. Approve User (Admin)
- **Method:** `POST`
- **Endpoint:** `/users/:id/approve`
- **Auth:** Admin
- **URL Parameter:** `id` (user_id)

### 15. Reject User (Admin)
- **Method:** `POST`
- **Endpoint:** `/users/:id/reject`
- **Auth:** Admin
- **URL Parameter:** `id` (user_id)

### 16. Update User Status (Admin)
- **Method:** `PUT`
- **Endpoint:** `/users/:id/status`
- **Auth:** Admin
- **URL Parameter:** `id` (user_id)
- **Body:**
```json
{
  "status": "active"
}
```

### 17. Delete User (Admin)
- **Method:** `DELETE`
- **Endpoint:** `/users/:id`
- **Auth:** Admin
- **URL Parameter:** `id` (user_id)

---

## 📚 Course Management APIs (`/api/courses`)

### 18. List Courses
- **Method:** `GET`
- **Endpoint:** `/courses`
- **Auth:** Public
- **Query Parameters:** Optional
  - `status`: Filter by status (published, draft, pending)
  - `category`: Filter by category
  - `instructor_id`: Filter by instructor
  - `search`: Search in title/description
  - `page`: Page number
  - `limit`: Items per page

### 19. Get Course Details
- **Method:** `GET`
- **Endpoint:** `/courses/:id`
- **Auth:** Public
- **URL Parameter:** `id` (course_id)

### 20. Create Course
- **Method:** `POST`
- **Endpoint:** `/courses`
- **Auth:** Instructor/Admin
- **Body:**
```json
{
  "title": "Course Title",
  "description": "Course description",
  "category": "Programming",
  "price": 99.99,
  "duration_hours": 10,
  "level": "beginner",
  "language": "English",
  "thumbnail_url": "https://example.com/image.jpg"
}
```

### 21. Update Course
- **Method:** `PUT`
- **Endpoint:** `/courses/:id`
- **Auth:** Instructor/Admin (own courses only)
- **URL Parameter:** `id` (course_id)
- **Body:** Same as Create Course

### 22. Delete Course
- **Method:** `DELETE`
- **Endpoint:** `/courses/:id`
- **Auth:** Instructor/Admin (own courses only)
- **URL Parameter:** `id` (course_id)

### 23. Create/Update Module
- **Method:** `POST`
- **Endpoint:** `/courses/:courseId/modules`
- **Auth:** Instructor/Admin
- **URL Parameter:** `courseId` (course_id)
- **Body:**
```json
{
  "title": "Module Title",
  "description": "Module description",
  "order_index": 1,
  "module_id": null
}
```
**Note:** Include `module_id` in body to update existing module

### 24. Create/Update Lesson
- **Method:** `POST`
- **Endpoint:** `/courses/:courseId/lessons`
- **Auth:** Instructor/Admin
- **URL Parameter:** `courseId` (course_id)
- **Body:**
```json
{
  "module_id": 1,
  "title": "Lesson Title",
  "description": "Lesson description",
  "content": "Lesson content",
  "video_url": "https://example.com/video.mp4",
  "duration_minutes": 30,
  "order_index": 1,
  "lesson_id": null
}
```
**Note:** Include `lesson_id` in body to update existing lesson

---

## 🎓 Enrollment APIs (`/api/enrollments`)

### 25. Get Enrollments
- **Method:** `GET`
- **Endpoint:** `/enrollments`
- **Auth:** Required
- **Query Parameters:** Optional
  - `course_id`: Filter by course
  - `status`: Filter by status

### 26. Enroll in Course
- **Method:** `POST`
- **Endpoint:** `/enrollments`
- **Auth:** Student
- **Body:**
```json
{
  "course_id": 1
}
```

### 27. Update Enrollment Progress
- **Method:** `PUT`
- **Endpoint:** `/enrollments/:id/progress`
- **Auth:** Required
- **URL Parameter:** `id` (enrollment_id)
- **Body:**
```json
{
  "progress_percentage": 50,
  "completed": false
}
```

### 28. Unenroll from Course
- **Method:** `DELETE`
- **Endpoint:** `/enrollments/:id`
- **Auth:** Required
- **URL Parameter:** `id` (enrollment_id)

### 29. Unenroll by Course ID
- **Method:** `DELETE`
- **Endpoint:** `/enrollments/course/:courseId`
- **Auth:** Student
- **URL Parameter:** `courseId` (course_id)

---

## 👨‍🏫 Instructor APIs (`/api/instructor`)

### 30. Get Dashboard Stats
- **Method:** `GET`
- **Endpoint:** `/instructor/dashboard/stats`
- **Auth:** Instructor

### 31. Get Instructor Courses
- **Method:** `GET`
- **Endpoint:** `/instructor/courses`
- **Auth:** Instructor
- **Query Parameters:** Optional
  - `status`: Filter by status (published, draft, pending)

### 32. Get Instructor Students
- **Method:** `GET`
- **Endpoint:** `/instructor/students`
- **Auth:** Instructor
- **Query Parameters:** Optional
  - `course_id`: Filter by course

### 33. Get Instructor Analytics
- **Method:** `GET`
- **Endpoint:** `/instructor/analytics`
- **Auth:** Instructor
- **Query Parameters:** Optional
  - `period`: Number of days (default: 30)

---

## 🛒 Cart APIs (`/api/cart`)

### 34. Get Cart
- **Method:** `GET`
- **Endpoint:** `/cart`
- **Auth:** Required

### 35. Add to Cart
- **Method:** `POST`
- **Endpoint:** `/cart`
- **Auth:** Required
- **Body:**
```json
{
  "course_id": 1
}
```

### 36. Remove from Cart
- **Method:** `DELETE`
- **Endpoint:** `/cart/:courseId`
- **Auth:** Required
- **URL Parameter:** `courseId` (course_id)

### 37. Clear Cart
- **Method:** `DELETE`
- **Endpoint:** `/cart`
- **Auth:** Required

---

## 📦 Content Library APIs (`/api/content`)

### 38. Get Content Library
- **Method:** `GET`
- **Endpoint:** `/content`
- **Auth:** Instructor
- **Query Parameters:** Optional
  - `type`: Filter by content type

### 39. Add Content
- **Method:** `POST`
- **Endpoint:** `/content`
- **Auth:** Instructor
- **Body:**
```json
{
  "title": "Content Title",
  "type": "video",
  "url": "https://example.com/content.mp4",
  "description": "Content description"
}
```

### 40. Delete Content
- **Method:** `DELETE`
- **Endpoint:** `/content/:id`
- **Auth:** Instructor
- **URL Parameter:** `id` (content_id)

---

## 💬 Forum APIs (`/api/forum`)

### 41. List Forum Topics
- **Method:** `GET`
- **Endpoint:** `/forum/topics`
- **Auth:** Public
- **Query Parameters:** Optional
  - `course_id`: Filter by course
  - `search`: Search in title/content
  - `page`: Page number
  - `limit`: Items per page

### 42. Get My Posts
- **Method:** `GET`
- **Endpoint:** `/forum/topics/my-posts`
- **Auth:** Required
- **Query Parameters:** Optional
  - `page`: Page number
  - `limit`: Items per page

### 43. Get Topic Details
- **Method:** `GET`
- **Endpoint:** `/forum/topics/:id`
- **Auth:** Public
- **URL Parameter:** `id` (topic_id)

### 44. Create Topic
- **Method:** `POST`
- **Endpoint:** `/forum/topics`
- **Auth:** Required
- **Body:**
```json
{
  "course_id": 1,
  "title": "Topic Title",
  "content": "Topic content"
}
```

### 45. Reply to Topic
- **Method:** `POST`
- **Endpoint:** `/forum/topics/:id/replies`
- **Auth:** Required
- **URL Parameter:** `id` (topic_id)
- **Body:**
```json
{
  "content": "Reply content"
}
```

### 46. Mark Reply as Solution
- **Method:** `POST`
- **Endpoint:** `/forum/replies/:id/solution`
- **Auth:** Required
- **URL Parameter:** `id` (reply_id)

---

## 🏆 Certificate APIs (`/api/certificates`)

### 47. Get Certificates
- **Method:** `GET`
- **Endpoint:** `/certificates`
- **Auth:** Student

### 48. Get Certificate by ID
- **Method:** `GET`
- **Endpoint:** `/certificates/:id`
- **Auth:** Required
- **URL Parameter:** `id` (certificate_id)

### 49. Generate Certificate
- **Method:** `POST`
- **Endpoint:** `/certificates`
- **Auth:** Student
- **Body:**
```json
{
  "course_id": 1
}
```

### 50. Download Certificate
- **Method:** `GET`
- **Endpoint:** `/certificates/:id/download`
- **Auth:** Required
- **URL Parameter:** `id` (certificate_id)

### 51. Verify Certificate
- **Method:** `GET`
- **Endpoint:** `/certificates/verify/:code`
- **Auth:** Public
- **URL Parameter:** `code` (verification_code)

---

## 💳 Transaction APIs (`/api/transactions`)

### 52. Get Transactions
- **Method:** `GET`
- **Endpoint:** `/transactions`
- **Auth:** Required
- **Query Parameters:** Optional
  - `status`: Filter by status
  - `type`: Filter by type
  - `start_date`: Start date filter
  - `end_date`: End date filter

### 53. Get Transaction by ID
- **Method:** `GET`
- **Endpoint:** `/transactions/:id`
- **Auth:** Required
- **URL Parameter:** `id` (transaction_id)

### 54. Create Transaction
- **Method:** `POST`
- **Endpoint:** `/transactions`
- **Auth:** Student
- **Body:**
```json
{
  "course_id": 1,
  "amount": 99.99,
  "payment_method": "credit_card",
  "payment_gateway": "stripe"
}
```

### 55. Update Transaction Status
- **Method:** `PUT`
- **Endpoint:** `/transactions/:id/status`
- **Auth:** Admin
- **URL Parameter:** `id` (transaction_id)
- **Body:**
```json
{
  "status": "completed"
}
```

### 56. Get Financial Reports
- **Method:** `GET`
- **Endpoint:** `/transactions/reports/summary`
- **Auth:** Admin
- **Query Parameters:** Optional
  - `start_date`: Start date
  - `end_date`: End date
  - `group_by`: Group by (day, week, month)

---

## 📊 Lesson Progress APIs (`/api/lesson-progress`)

### 57. Get Lesson Progress by Enrollment
- **Method:** `GET`
- **Endpoint:** `/lesson-progress/enrollment/:enrollmentId`
- **Auth:** Required
- **URL Parameter:** `enrollmentId` (enrollment_id)

### 58. Update Lesson Progress
- **Method:** `PUT`
- **Endpoint:** `/lesson-progress/:id`
- **Auth:** Required
- **URL Parameter:** `id` (progress_id)
- **Body:**
```json
{
  "completed": true,
  "time_spent_minutes": 30,
  "last_position": 120
}
```

### 59. Save Lesson Progress
- **Method:** `POST`
- **Endpoint:** `/lesson-progress`
- **Auth:** Required
- **Body:**
```json
{
  "enrollment_id": 1,
  "lesson_id": 1,
  "completed": true,
  "time_spent_minutes": 30,
  "last_position": 120
}
```

---

## 📝 System Logs APIs (`/api/system-logs`)

### 60. Get System Logs
- **Method:** `GET`
- **Endpoint:** `/system-logs`
- **Auth:** Admin
- **Query Parameters:** Optional
  - `level`: Filter by log level (info, warning, error)
  - `start_date`: Start date filter
  - `end_date`: End date filter
  - `page`: Page number
  - `limit`: Items per page

### 61. Create System Log
- **Method:** `POST`
- **Endpoint:** `/system-logs`
- **Auth:** Required
- **Body:**
```json
{
  "level": "info",
  "message": "Log message",
  "module": "courses",
  "user_id": 1
}
```

### 62. Cleanup System Logs
- **Method:** `DELETE`
- **Endpoint:** `/system-logs/cleanup`
- **Auth:** Admin
- **Query Parameters:** Optional
  - `days`: Number of days to keep (default: 90)

---

## ⚙️ Settings APIs (`/api/settings`)

### 63. Get All Settings
- **Method:** `GET`
- **Endpoint:** `/settings`
- **Auth:** Admin

### 64. Get Setting by Key
- **Method:** `GET`
- **Endpoint:** `/settings/:key`
- **Auth:** Public/Auth (depends on setting)
- **URL Parameter:** `key` (setting_key)

### 65. Update Setting
- **Method:** `PUT`
- **Endpoint:** `/settings/:key`
- **Auth:** Admin
- **URL Parameter:** `key` (setting_key)
- **Body:**
```json
{
  "value": "setting_value",
  "description": "Setting description"
}
```

### 66. Bulk Update Settings
- **Method:** `PUT`
- **Endpoint:** `/settings`
- **Auth:** Admin
- **Body:**
```json
{
  "settings": {
    "setting_key1": "value1",
    "setting_key2": "value2"
  }
}
```

---

## 🔥 Firebase Email Verification APIs (`/api/firebase-auth`)

### 70. Verify Email (Firebase Action Code)
- **Method:** `POST`
- **Endpoint:** `/firebase-auth/verify-email`
- **Auth:** Public
- **Body:**
```json
{
  "actionCode": "firebase-action-code-from-email-link",
  "email": "user@example.com"
}
```

### 71. Verify Email (Firebase ID Token)
- **Method:** `POST`
- **Endpoint:** `/firebase-auth/verify-email-token`
- **Auth:** Public
- **Body:**
```json
{
  "idToken": "firebase-id-token"
}
```

### 72. Resend Firebase Verification Email
- **Method:** `POST`
- **Endpoint:** `/firebase-auth/resend-verification`
- **Auth:** Public
- **Body:**
```json
{
  "email": "user@example.com"
}
```

**Note:** Firebase email verification is optional. If not configured, the system automatically falls back to custom OTP verification.

---

## 🧪 Test APIs (Development Only)

### 67. Test Database Connection
- **Method:** `GET`
- **Endpoint:** `/test/db`
- **Auth:** Public

### 68. Test API Status
- **Method:** `GET`
- **Endpoint:** `/test/api`
- **Auth:** Public

### 69. Test Email
- **Method:** `POST`
- **Endpoint:** `/test-email`
- **Auth:** Admin
- **Body:**
```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "body": "Test email body"
}
```

### 70. Get Email Status
- **Method:** `GET`
- **Endpoint:** `/email-status`
- **Auth:** Public

### 71. Test OTP
- **Method:** `POST`
- **Endpoint:** `/test-otp`
- **Auth:** Public
- **Body:**
```json
{
  "email": "test@example.com"
}
```

### 72. Database Test Write
- **Method:** `POST`
- **Endpoint:** `/db/test-write`
- **Auth:** Admin
- **Body:**
```json
{
  "test_data": "value"
}
```

### 73. Database Status
- **Method:** `GET`
- **Endpoint:** `/db/status`
- **Auth:** Public

---

## 📋 Summary

**Total APIs:** 76 endpoints

**By Category:**
- Authentication: 9 endpoints
- User Management: 8 endpoints
- Course Management: 7 endpoints
- Enrollment: 5 endpoints
- Instructor: 4 endpoints
- Cart: 4 endpoints
- Content Library: 3 endpoints
- Forum: 6 endpoints
- Certificates: 5 endpoints
- Transactions: 5 endpoints
- Lesson Progress: 3 endpoints
- System Logs: 3 endpoints
- Settings: 4 endpoints
- Firebase Auth: 3 endpoints
- Test APIs: 7 endpoints

---

## 🔑 Authentication Flow for Postman

1. **Register/Login** to get a JWT token
2. **Copy the token** from the response
3. **Set Authorization Header** in Postman:
   - Type: Bearer Token
   - Token: `<paste_token_here>`
4. **Use the token** for all authenticated endpoints

### Admin Account Setup

To create an admin account for testing:

```bash
cd server
npm run create-admin
```

Or with custom credentials:
```bash
node create-admin-user.js admin@example.com yourpassword
```

**Default Test Accounts:**

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Instructor (auto-approved):**
- Email: `teacher.approved@example.com`
- Password: `teacher123`

**Student:**
- Email: `student@example.com`
- Password: `student123`

**Note:** 
- Admin accounts bypass email verification and approval checks
- Student accounts are auto-approved and auto-verified
- Instructor accounts require admin approval (unless created with AUTO_APPROVE=true)

See `docs/USER_ACCOUNT_SETUP.md` for creating custom accounts.

---

## 📝 Postman Collection Setup Tips

1. **Create Environment Variables:**
   - `base_url`: `http://localhost:5173/api`
   - `auth_token`: (will be set after login)

2. **Create Pre-request Script** (for authenticated endpoints):
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('auth_token')
});
```

3. **Create Test Script** (for login endpoint):
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.token) {
        pm.environment.set('auth_token', jsonData.token);
    }
}
```

---

**Last Updated:** 2024-01-20  
**Version:** 1.0

