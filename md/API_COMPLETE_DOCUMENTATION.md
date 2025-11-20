# Complete API Documentation

## Overview
This document provides a comprehensive list of all API endpoints implemented based on the SRS requirements.

## Base URL
```
http://localhost:5173/api
```

---

## Authentication APIs (`/api/auth`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| POST | `/auth/register` | Public | Register new user | FR-001 |
| POST | `/auth/login` | Public | Login user | FR-002 |
| POST | `/auth/verify-email` | Public | Verify email | FR-003 |
| POST | `/auth/resend-verification` | Public | Resend verification | FR-003 |
| GET | `/auth/me` | Auth | Get current user | FR-004 |

---

## User Management APIs (`/api/users`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/users` | Admin | List all users | FR-010 |
| GET | `/users/me` | Auth | Get own profile | FR-006 |
| PUT | `/users/me` | Auth | Update own profile | FR-006, FR-007, FR-008 |
| POST | `/users/:id/approve` | Admin | Approve user | FR-012 |
| POST | `/users/:id/reject` | Admin | Reject user | FR-012 |
| PUT | `/users/:id/status` | Admin | Update user status | FR-012 |
| DELETE | `/users/:id` | Admin | Delete user (soft) | FR-011 |

---

## Course Management APIs (`/api/courses`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/courses` | Public | List courses | FR-015, FR-016, FR-017 |
| GET | `/courses/:id` | Public | Get course details | FR-019 |
| POST | `/courses` | Instructor/Admin | Create course | FR-020, FR-021 |
| PUT | `/courses/:id` | Instructor/Admin | Update course | FR-021, FR-025 |
| DELETE | `/courses/:id` | Instructor/Admin | Delete course | FR-025 |
| POST | `/courses/:courseId/modules` | Instructor/Admin | Create/Update module | FR-023 |
| POST | `/courses/:courseId/lessons` | Instructor/Admin | Create/Update lesson | FR-022, FR-023 |

---

## Enrollment APIs (`/api/enrollments`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/enrollments` | Auth | Get enrollments | FR-033 |
| POST | `/enrollments` | Student | Enroll in course | FR-030, FR-032 |
| PUT | `/enrollments/:id/progress` | Auth | Update progress | FR-048, FR-049 |
| DELETE | `/enrollments/:id` | Auth | Unenroll | FR-030 |
| DELETE | `/enrollments/course/:courseId` | Student | Unenroll by course | FR-030 |

---

## Certificate APIs (`/api/certificates`) ⭐ NEW

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/certificates` | Student | Get user's certificates | FR-055 |
| GET | `/certificates/:id` | Auth | Get single certificate | FR-055 |
| POST | `/certificates` | Student | Generate certificate | FR-052 |
| GET | `/certificates/:id/download` | Auth | Download certificate | FR-054 |
| GET | `/certificates/verify/:code` | Public | Verify certificate | FR-053 |

---

## Transaction APIs (`/api/transactions`) ⭐ NEW

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/transactions` | Auth | Get transactions | FR-083, FR-084 |
| GET | `/transactions/:id` | Auth | Get single transaction | FR-083 |
| POST | `/transactions` | Student | Create transaction | FR-039, FR-040 |
| PUT | `/transactions/:id/status` | Admin | Update transaction status | FR-039 |
| GET | `/transactions/reports/summary` | Admin | Financial reports | FR-079, FR-080, FR-081, FR-082, FR-085 |

---

## Lesson Progress APIs (`/api/lesson-progress`) ⭐ NEW

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/lesson-progress/enrollment/:id` | Auth | Get progress for enrollment | FR-048, FR-049 |
| PUT | `/lesson-progress/:id` | Auth | Update progress | FR-050, FR-051 |
| POST | `/lesson-progress` | Auth | Create/update progress | FR-050, FR-051 |

**Features:**
- Auto-updates enrollment progress percentage
- Auto-generates certificate when course reaches 100%

---

## System Logs APIs (`/api/system-logs`) ⭐ NEW

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/system-logs` | Admin | Get logs | FR-096, FR-097, FR-098, FR-099 |
| POST | `/system-logs` | Auth | Create log entry | FR-096 |
| DELETE | `/system-logs/cleanup` | Admin | Cleanup old logs | FR-099 |

---

## Settings APIs (`/api/settings`) ⭐ NEW

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/settings` | Admin | Get all settings | FR-087 |
| GET | `/settings/:key` | Public/Auth | Get single setting | FR-087 |
| PUT | `/settings/:key` | Admin | Update setting | FR-087, FR-088, FR-089, FR-090 |
| PUT | `/settings` | Admin | Bulk update settings | FR-087 |

---

## Instructor APIs (`/api/instructor`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/instructor/dashboard/stats` | Instructor | Dashboard statistics | FR-068 |
| GET | `/instructor/courses` | Instructor | Get instructor's courses | FR-068 |
| GET | `/instructor/students` | Instructor | Get instructor's students | FR-070 |
| GET | `/instructor/analytics` | Instructor | Get analytics | FR-069, FR-071 |

---

## Cart APIs (`/api/cart`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/cart` | Auth | Get cart | FR-035 |
| POST | `/cart` | Auth | Add to cart | FR-034 |
| DELETE | `/cart/:courseId` | Auth | Remove from cart | FR-036 |
| DELETE | `/cart` | Auth | Clear cart | FR-036 |

---

## Content Library APIs (`/api/content`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/content` | Instructor | Get content library | FR-022 |
| POST | `/content` | Instructor | Add content | FR-022 |
| DELETE | `/content/:id` | Instructor | Delete content | FR-022 |

---

## Forum APIs (`/api/forum`)

| Method | Endpoint | Auth | Description | SRS Ref |
|--------|----------|------|-------------|---------|
| GET | `/forum/topics` | Public | List topics | FR-056, FR-058 |
| GET | `/forum/topics/:id` | Public | Get topic | FR-056 |
| POST | `/forum/topics` | Auth | Create topic | FR-056, FR-060 |
| POST | `/forum/topics/:id/replies` | Auth | Reply to topic | FR-057, FR-061 |
| POST | `/forum/replies/:id/solution` | Auth | Mark as solution | FR-061 |

---

## Client-Side API Methods

All endpoints are accessible via `window.api` object:

```javascript
// Certificates
api.getCertificates()
api.getCertificate(id)
api.generateCertificate(courseId)
api.downloadCertificate(id)
api.verifyCertificate(code)

// Transactions
api.getTransactions()
api.getTransaction(id)
api.createTransaction(data)
api.getFinancialReports(params)

// Lesson Progress
api.getLessonProgress(enrollmentId)
api.updateLessonProgress(progressId, data)
api.saveLessonProgress(data)

// System Logs
api.getSystemLogs(params)
api.createSystemLog(data)
api.cleanupSystemLogs(days)

// Settings
api.getSettings()
api.getSetting(key)
api.updateSetting(key, value, description)
api.updateSettings(settings)
```

---

## Implementation Status

### ✅ Completed (60/102 requirements - 59%)
- User Management (FR-001 to FR-014)
- Course Management (FR-015 to FR-029)
- Enrollment (FR-030 to FR-033)
- Shopping Cart (FR-034 to FR-037)
- Course Delivery (FR-043 to FR-047)
- Progress Tracking (FR-048 to FR-051) ⭐ NEW
- Certificates (FR-052 to FR-055) ⭐ NEW
- Community Features (FR-056 to FR-061)
- Dashboards (FR-063 to FR-074)
- Financial Management (FR-079 to FR-085) ⭐ NEW
- System Logs (FR-096 to FR-099) ⭐ NEW
- Settings (FR-087 to FR-090) ⭐ NEW

### 🟡 Partial (15/102 requirements - 15%)
- Payment Processing (FR-038 to FR-042) - Structure exists, needs gateway integration
- Course Moderation (FR-026 to FR-029) - Needs approve/reject endpoints
- Financial Reports (FR-075, FR-076) - Basic implementation

### ❌ Missing (27/102 requirements - 26%)
- Password Reset (FR-003, FR-009)
- Course Prerequisites (FR-024, FR-031)
- File Downloads (FR-046)
- Upvoting/Downvoting (FR-062)
- Payment Gateway Integration (FR-038, FR-039)
- Invoice Generation (FR-041)
- Refund Processing (FR-086)
- System Monitoring (FR-092 to FR-095)
- Maintenance Mode (FR-091)

---

## Database Schema

All APIs use the existing database schema defined in `server/database/schema.sql`:

- ✅ `users` - User management
- ✅ `courses` - Course management
- ✅ `modules` - Course modules
- ✅ `lessons` - Course lessons
- ✅ `enrollments` - Student enrollments
- ✅ `lesson_progress` - Progress tracking
- ✅ `certificates` - Certificate generation
- ✅ `transactions` - Payment transactions
- ✅ `coupons` - Discount codes
- ✅ `reviews` - Course reviews
- ✅ `forum_topics` - Forum topics
- ✅ `forum_replies` - Forum replies
- ✅ `system_logs` - System logging
- ✅ `settings` - System settings
- ✅ `notifications` - User notifications

---

## Next Steps

1. **Payment Gateway Integration** - Integrate Stripe/PayPal
2. **PDF Certificate Generation** - Use pdfkit or puppeteer
3. **File Upload/Download** - Implement file serving
4. **Password Reset** - Email-based reset flow
5. **System Monitoring** - Server health metrics
6. **Course Prerequisites** - Add prerequisite checking

---

**Last Updated:** 2024-01-20  
**Version:** 1.0


