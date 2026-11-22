# Entity Relationship Diagram (ERD)
## VIAN Academy Learning Management System

**Document Version:** 1.1  
**Date:** 2024-01-20  
**Last Updated:** 2024-01-20  
**Project:** VIAN Academy LMS Dashboard

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Descriptions](#2-entity-descriptions)
3. [Relationship Descriptions](#3-relationship-descriptions)
4. [ERD Diagram](#4-erd-diagram)
5. [Database Schema](#5-database-schema)

---

## 1. Overview

This document describes the Entity Relationship Diagram (ERD) for the VIAN Academy LMS. The ERD defines the data model, entities, attributes, and relationships that form the foundation of the database design.

### 1.1 Design Principles
- Normalization to 3NF (Third Normal Form)
- Referential integrity
- Scalability and performance
- Data consistency

---

## 2. Entity Descriptions

### 2.1 Users Entity
**Purpose**: Stores information about all system users (Students, Instructors, Admins)

**Attributes**:
- `user_id` (PK) - Unique identifier
- `email` - User email (unique)
- `password_hash` - Hashed password
- `first_name` - User first name
- `last_name` - User last name
- `role` - User role (student, instructor, admin)
- `status` - Account status (active, inactive, suspended)
- `avatar_url` - Profile picture URL
- `phone` - Phone number
- `bio` - User biography
- `social_link` - Social media profile link
- `email_verified` - Whether email is verified
- `email_verification_token` - Email verification token
- `email_verified_at` - Email verification timestamp
- `admin_approved` - Whether account is approved by admin (for instructors)
- `admin_approved_at` - Admin approval timestamp
- `approved_by` (FK) - Reference to Users (admin who approved) - **Admin can create other admins**
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp

**Constraints**:
- Email must be unique
- Role must be one of: student, instructor, admin
- Status must be one of: active, inactive, suspended
- `approved_by` references `users(user_id)` - Allows admin to create/approve other admins

**Role-Specific Information**:

#### Students
- Can enroll in courses
- Can view course content after enrollment
- Can track progress and earn certificates
- Can participate in forums and reviews
- Auto-approved (`admin_approved = true`)

#### Instructors
- **Course CRUD Operations**: Instructors can Create, Read, Update, and Delete their own courses
  - **Create**: Instructors can create new courses via `/api/courses` (POST)
  - **Read**: Instructors can view their courses via `/api/instructor/courses` (GET)
  - **Update**: Instructors can update their courses via `/api/courses/:id` (PUT)
  - **Delete**: Instructors can delete their courses via `/api/courses/:id` (DELETE)
- Can manage course modules and lessons
- Can upload course materials (videos, documents, exercises)
- Can view student enrollments and analytics
- Can track revenue and earnings
- Require admin approval before login (`admin_approved = false` initially)
- Can only modify courses they own (enforced by `instructor_id` foreign key)

#### Admins
- Can manage all users (create, edit, delete, suspend)
- **Can create other admins**: Admins can create new admin accounts via `/api/users` (POST) with `role='admin'` and `approved_by` set to the creating admin's `user_id`
- Can approve/reject instructor accounts
- Can approve/reject course submissions
- Can view system logs and monitoring
- Can manage system settings
- Can view financial reports and analytics
- Full access to all system features

---

### 2.2 Courses Entity
**Purpose**: Stores course information created by instructors

**Attributes**:
- `course_id` (PK) - Unique identifier
- `instructor_id` (FK) - Reference to Users (instructor) - **Enforces ownership for CRUD operations**
- `title` - Course title
- `description` - Course description
- `short_description` - Brief course summary
- `price` - Course price
- `category_id` (FK) - Reference to Categories
- `thumbnail_url` - Course thumbnail image
- `status` - Course status (draft, pending, approved, rejected, published)
- `rating` - Average rating (0-5)
- `total_enrollments` - Number of enrollments (auto-calculated)
- `total_lessons` - Total number of lessons (auto-calculated)
- `duration_hours` - Course duration in hours
- `level` - Course level (beginner, intermediate, advanced)
- `language` - Course language
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `published_at` - Publication timestamp

**Constraints**:
- Price must be >= 0
- Rating must be between 0 and 5
- Status must be one of: draft, pending, approved, rejected, published
- `instructor_id` references `users(user_id)` with `ON DELETE CASCADE` - Ensures instructor ownership

**Instructor Course CRUD Operations**:
- **Create**: Instructors create courses via API, `instructor_id` is automatically set to the authenticated instructor's `user_id`
- **Read**: Instructors can read their own courses; admins can read all courses
- **Update**: Instructors can only update courses where `instructor_id` matches their `user_id`; admins can update any course
- **Delete**: Instructors can only delete courses where `instructor_id` matches their `user_id`; admins can delete any course
- **Ownership Enforcement**: All CRUD operations check `instructor_id` to ensure instructors can only manage their own courses

---

### 2.3 Categories Entity
**Purpose**: Organizes courses into categories

**Attributes**:
- `category_id` (PK) - Unique identifier
- `name` - Category name
- `slug` - URL-friendly identifier
- `description` - Category description
- `icon_url` - Category icon
- `parent_category_id` (FK) - Reference to Categories (for subcategories)
- `created_at` - Creation timestamp

---

### 2.4 Modules Entity
**Purpose**: Organizes lessons within a course

**Attributes**:
- `module_id` (PK) - Unique identifier
- `course_id` (FK) - Reference to Courses
- `title` - Module title
- `description` - Module description
- `order_index` - Display order within course
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 2.5 Lessons Entity
**Purpose**: Stores individual lesson content

**Attributes**:
- `lesson_id` (PK) - Unique identifier
- `module_id` (FK) - Reference to Modules
- `title` - Lesson title
- `description` - Lesson description
- `content_type` - Type of content (video, text, quiz, assignment)
- `video_url` - Video file URL
- `video_duration` - Video duration in seconds
- `content_text` - Text content (for text lessons)
- `order_index` - Display order within module
- `is_preview` - Whether lesson is free preview
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Constraints**:
- Content type must be one of: video, text, quiz, assignment

---

### 2.6 Enrollments Entity
**Purpose**: Tracks student course enrollments

**Attributes**:
- `enrollment_id` (PK) - Unique identifier
- `student_id` (FK) - Reference to Users (student)
- `course_id` (FK) - Reference to Courses
- `enrollment_date` - Date of enrollment
- `completion_date` - Date of completion (nullable)
- `progress_percentage` - Completion percentage (0-100)
- `status` - Enrollment status (active, completed, dropped)
- `last_accessed_at` - Last access timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Constraints**:
- Progress percentage must be between 0 and 100
- Status must be one of: active, completed, dropped
- Unique constraint on (student_id, course_id)

---

### 2.7 Lesson Progress Entity
**Purpose**: Tracks student progress through individual lessons

**Attributes**:
- `progress_id` (PK) - Unique identifier
- `enrollment_id` (FK) - Reference to Enrollments
- `lesson_id` (FK) - Reference to Lessons
- `is_completed` - Whether lesson is completed
- `watch_time_seconds` - Total time watched
- `completion_date` - Date of completion (nullable)
- `last_position` - Last video position (for videos)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Constraints**:
- Unique constraint on (enrollment_id, lesson_id)

---

### 2.8 Transactions Entity
**Purpose**: Records all payment transactions

**Attributes**:
- `transaction_id` (PK) - Unique identifier
- `student_id` (FK) - Reference to Users (student)
- `course_id` (FK) - Reference to Courses (nullable for cart purchases)
- `amount` - Transaction amount
- `currency` - Currency code (USD, EUR, etc.)
- `payment_method` - Payment method (credit_card, paypal, bank_transfer)
- `payment_status` - Status (pending, completed, failed, refunded)
- `payment_gateway_transaction_id` - External gateway transaction ID
- `coupon_code` - Applied coupon code (nullable)
- `discount_amount` - Discount amount applied
- `transaction_date` - Transaction timestamp
- `created_at` - Creation timestamp

**Constraints**:
- Amount must be >= 0
- Payment status must be one of: pending, completed, failed, refunded

---

### 2.9 Coupons Entity
**Purpose**: Stores discount coupons

**Attributes**:
- `coupon_id` (PK) - Unique identifier
- `code` - Coupon code (unique)
- `discount_type` - Type (percentage, fixed_amount)
- `discount_value` - Discount value
- `min_purchase_amount` - Minimum purchase required
- `max_uses` - Maximum number of uses
- `used_count` - Current usage count
- `valid_from` - Validity start date
- `valid_until` - Validity end date
- `is_active` - Whether coupon is active
- `created_at` - Creation timestamp

**Constraints**:
- Discount value must be > 0
- Valid_until must be > valid_from

---

### 2.10 Certificates Entity
**Purpose**: Stores course completion certificates

**Attributes**:
- `certificate_id` (PK) - Unique identifier
- `enrollment_id` (FK) - Reference to Enrollments
- `student_id` (FK) - Reference to Users (student)
- `course_id` (FK) - Reference to Courses
- `certificate_number` - Unique certificate number
- `issued_date` - Date certificate was issued
- `certificate_url` - URL to certificate PDF/image
- `created_at` - Creation timestamp

**Constraints**:
- Certificate number must be unique

---

### 2.11 Reviews Entity
**Purpose**: Stores course reviews and ratings

**Attributes**:
- `review_id` (PK) - Unique identifier
- `course_id` (FK) - Reference to Courses
- `student_id` (FK) - Reference to Users (student)
- `rating` - Rating (1-5)
- `comment` - Review comment
- `is_approved` - Whether review is approved by admin
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Constraints**:
- Rating must be between 1 and 5
- Unique constraint on (course_id, student_id)

---

### 2.12 Forum Topics Entity
**Purpose**: Stores forum discussion topics

**Attributes**:
- `topic_id` (PK) - Unique identifier
- `course_id` (FK) - Reference to Courses (nullable for general topics)
- `author_id` (FK) - Reference to Users
- `title` - Topic title
- `content` - Topic content
- `is_pinned` - Whether topic is pinned
- `is_locked` - Whether topic is locked
- `view_count` - Number of views
- `reply_count` - Number of replies
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 2.13 Forum Replies Entity
**Purpose**: Stores replies to forum topics

**Attributes**:
- `reply_id` (PK) - Unique identifier
- `topic_id` (FK) - Reference to Forum Topics
- `author_id` (FK) - Reference to Users
- `content` - Reply content
- `is_solution` - Whether reply is marked as solution
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 2.14 System Logs Entity
**Purpose**: Stores system activity logs

**Attributes**:
- `log_id` (PK) - Unique identifier
- `user_id` (FK) - Reference to Users (nullable for system events)
- `log_level` - Log level (info, warning, error, success)
- `log_type` - Log type (user, system, security, payment)
- `message` - Log message
- `ip_address` - User IP address
- `user_agent` - User agent string
- `created_at` - Creation timestamp

**Constraints**:
- Log level must be one of: info, warning, error, success
- Log type must be one of: user, system, security, payment

---

### 2.15 Settings Entity
**Purpose**: Stores system configuration settings

**Attributes**:
- `setting_id` (PK) - Unique identifier
- `setting_key` - Setting key (unique)
- `setting_value` - Setting value (JSON or text)
- `setting_type` - Setting type (string, number, boolean, json)
- `description` - Setting description
- `updated_at` - Last update timestamp
- `updated_by` (FK) - Reference to Users (admin who updated)

**Constraints**:
- Setting key must be unique

---

### 2.16 Notifications Entity
**Purpose**: Stores user notifications

**Attributes**:
- `notification_id` (PK) - Unique identifier
- `user_id` (FK) - Reference to Users
- `type` - Notification type (course, payment, system, etc.)
- `title` - Notification title
- `message` - Notification message
- `is_read` - Whether notification is read
- `action_url` - URL to related action
- `created_at` - Creation timestamp

---

## 3. Relationship Descriptions

### 3.1 User Relationships
- **Users → Courses** (One-to-Many): An instructor can create many courses (CRUD operations)
  - **CRUD Enforcement**: `instructor_id` foreign key ensures instructors can only manage their own courses
  - **Create**: Instructors create courses, `instructor_id` automatically set
  - **Read**: Instructors read their courses via `/api/instructor/courses`
  - **Update**: Instructors update courses where `instructor_id` matches
  - **Delete**: Instructors delete courses where `instructor_id` matches
- **Users → Users** (Self-referential via `approved_by`): Admins can create/approve other admins and instructors
  - **Admin Creation**: When an admin creates another admin, `approved_by` is set to the creating admin's `user_id`
  - **Instructor Approval**: When an admin approves an instructor, `approved_by` is set to the approving admin's `user_id`
- **Users → Enrollments** (One-to-Many): A student can have many enrollments
- **Users → Transactions** (One-to-Many): A student can have many transactions
- **Users → Reviews** (One-to-Many): A student can write many reviews
- **Users → Forum Topics** (One-to-Many): A user can create many forum topics
- **Users → Forum Replies** (One-to-Many): A user can write many replies
- **Users → System Logs** (One-to-Many): A user can have many log entries
- **Users → Notifications** (One-to-Many): A user can have many notifications
- **Users → Settings** (One-to-Many via `updated_by`): Admins can update system settings

### 3.2 Course Relationships
- **Courses → Modules** (One-to-Many): A course has many modules
- **Courses → Enrollments** (One-to-Many): A course can have many enrollments
- **Courses → Transactions** (One-to-Many): A course can have many transactions
- **Courses → Reviews** (One-to-Many): A course can have many reviews
- **Courses → Forum Topics** (One-to-Many): A course can have many forum topics
- **Courses → Categories** (Many-to-One): A course belongs to one category

### 3.3 Module Relationships
- **Modules → Lessons** (One-to-Many): A module has many lessons

### 3.4 Enrollment Relationships
- **Enrollments → Lesson Progress** (One-to-Many): An enrollment has many lesson progress records
- **Enrollments → Certificates** (One-to-One): An enrollment can have one certificate

### 3.5 Category Relationships
- **Categories → Categories** (Self-referential): Categories can have subcategories

---

## 4. ERD Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                               │
│─────────────────────────────────────────────────────────────│
│ user_id (PK)                                                 │
│ email (UNIQUE)                                               │
│ password_hash                                                │
│ first_name, last_name                                        │
│ role (student/instructor/admin)                             │
│ status (active/inactive/suspended)                           │
│ admin_approved (for instructors)                             │
│ approved_by (FK → Users) ⭐ Admin can create admins          │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 1:N (instructor_id)
       │ ⭐ Instructor CRUD: Only manage courses where
       │    instructor_id = user_id
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       │                                             │
┌──────▼──────┐                              ┌──────▼──────┐
│  Courses    │                              │ Enrollments │
│─────────────│                              │─────────────│
│ course_id   │                              │ enrollment_│
│ instructor_ │◄────────────────────────────│ id          │
│ id (FK) ⭐  │                              │ student_id  │
│ title       │                              │ course_id   │
│ description │                              │ progress    │
│ price       │                              │ status      │
│ status      │                              └──────┬──────┘
│ (draft/     │                                     │
│ pending/    │                                     │ 1:1
│ published)  │                                     │
└──────┬──────┘                                     │
       │                                            │
       │ 1:N                                       │
       │                                           │
       ├──────────────┐                   ┌────────▼────────┐
       │              │                   │  Certificates   │
┌──────▼──────┐  ┌────▼──────┐            │─────────────────│
│  Modules    │  │ Lessons   │            │ certificate_id  │
│─────────────│  │───────────│            │ enrollment_id   │
│ module_id   │  │ lesson_id │            │ certificate_num │
│ course_id   │  │ module_id │            │ issued_date     │
│ title       │  │ title     │            └─────────────────┘
│ order_index │  │ content_  │
└──────┬──────┘  │ type      │
       │         │ content_  │
       │ 1:N     │ data      │
       │         │ order_idx │
       │         └───────────┘
       │
┌──────▼──────┐
│Lesson Progress│
│──────────────│
│ progress_id  │
│ enrollment_id│
│ lesson_id    │
│ is_completed │
│ watch_time   │
│ last_position│
└──────────────┘

┌─────────────┐         ┌─────────────┐
│Transactions │         │  Categories │
│─────────────│         │─────────────│
│ transaction │         │ category_id │
│ _id (PK)    │         │ name        │
│ student_id  │         │ slug        │
│ course_id   │         │ parent_id   │
│ amount      │         └─────────────┘
│ status      │
└─────────────┘

⭐ Key Relationships:
- Users → Courses: Instructor CRUD (instructor_id enforces ownership)
- Users → Users: Admin can create admins (approved_by tracks creator)
- Courses → Modules → Lessons: Hierarchical course structure
- Enrollments → Certificates: One certificate per completed course
```

---

## 5. Database Schema

See `database/schema.sql` for the complete SQL schema definition.

### 5.1 Key Relationships Summary

| Parent Entity | Child Entity | Relationship Type | Foreign Key | Notes |
|---------------|--------------|-------------------|-------------|-------|
| Users | Courses | One-to-Many | instructor_id | **Instructor CRUD**: Instructors can only manage courses where `instructor_id` matches their `user_id` |
| Users | Users | Self-referential | approved_by | **Admin Creation**: Admins can create other admins; `approved_by` tracks the creating admin |
| Users | Enrollments | One-to-Many | student_id | Students enroll in courses |
| Users | Transactions | One-to-Many | student_id | Students make payments |
| Courses | Modules | One-to-Many | course_id | Courses contain modules |
| Modules | Lessons | One-to-Many | module_id | Modules contain lessons |
| Enrollments | Lesson Progress | One-to-Many | enrollment_id | Track progress per lesson |
| Enrollments | Certificates | One-to-One | enrollment_id | One certificate per completed enrollment |
| Courses | Categories | Many-to-One | category_id | Courses belong to categories |

### 5.2 Role-Based Access Control

#### Instructor Permissions
- **Course CRUD**: Full CRUD operations on courses where `instructor_id = user_id`
  - Create: `POST /api/courses` (sets `instructor_id` automatically)
  - Read: `GET /api/instructor/courses` (filters by `instructor_id`)
  - Update: `PUT /api/courses/:id` (validates `instructor_id` matches)
  - Delete: `DELETE /api/courses/:id` (validates `instructor_id` matches)
- **Module/Lesson Management**: Can create/update modules and lessons for their courses
- **Student Management**: Can view students enrolled in their courses
- **Analytics**: Can view revenue and analytics for their courses only

#### Admin Permissions
- **User Management**: Full CRUD on all users
  - **Admin Creation**: Can create new admin accounts via `POST /api/users` with `role='admin'` and `approved_by=admin_user_id`
  - **Instructor Approval**: Can approve/reject instructors via `POST /api/users/:id/approve`
- **Course Moderation**: Can approve/reject courses, edit any course
- **System Management**: Can manage settings, view logs, monitor system
- **Financial Reports**: Can view all financial data

#### Student Permissions
- **Course Enrollment**: Can enroll in published courses
- **Progress Tracking**: Can track their own progress
- **Certificates**: Can view/download their certificates
- **Community**: Can participate in forums and reviews

---

## 6. Access Control and Permissions

### 6.1 Instructor Course CRUD Operations

Instructors have full CRUD (Create, Read, Update, Delete) capabilities for courses they own:

**Database-Level Enforcement**:
- `courses.instructor_id` foreign key references `users.user_id`
- `ON DELETE CASCADE` ensures courses are deleted when instructor is deleted
- Index on `instructor_id` for efficient queries

**API-Level Enforcement**:
- **Create**: `POST /api/courses` - `instructor_id` automatically set from authenticated user
- **Read**: `GET /api/instructor/courses` - Filters by `instructor_id = req.user.user_id`
- **Update**: `PUT /api/courses/:id` - Validates `instructor_id` matches before update
- **Delete**: `DELETE /api/courses/:id` - Validates `instructor_id` matches before delete

**Example SQL Queries**:
```sql
-- Create course (instructor_id set automatically)
INSERT INTO courses (instructor_id, title, description, price, ...)
VALUES ($instructor_id, $title, $description, $price, ...);

-- Read instructor's courses
SELECT * FROM courses WHERE instructor_id = $instructor_id;

-- Update course (with ownership check)
UPDATE courses SET title = $title, ...
WHERE course_id = $course_id AND instructor_id = $instructor_id;

-- Delete course (with ownership check)
DELETE FROM courses 
WHERE course_id = $course_id AND instructor_id = $instructor_id;
```

### 6.2 Admin Creation by Admin

Admins can create other admin accounts:

**Database Schema**:
- `users.approved_by` foreign key references `users(user_id)`
- When admin creates another admin: `approved_by` = creating admin's `user_id`
- `admin_approved` set to `true` for admin accounts

**API Endpoint**:
- `POST /api/users` - Admin can create users with `role='admin'`
- `approved_by` field tracks which admin created/approved the account

**Example**:
```sql
-- Admin creates another admin
INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, approved_by)
VALUES ($email, $hash, $first, $last, 'admin', TRUE, $creating_admin_id);
```

**Workflow**:
1. Admin A creates Admin B via API
2. `approved_by` = Admin A's `user_id`
3. `admin_approved` = `true` (admins are auto-approved)
4. Admin B can immediately login and has full admin privileges

### 6.3 Instructor Approval Workflow

1. User registers as instructor → `admin_approved = false`
2. Admin reviews and approves → `admin_approved = true`, `approved_by` = admin's `user_id`
3. Instructor can now login and create courses

---

## 7. Change History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-20 | Initial ERD Document |
| 1.1 | 2024-01-20 | Added instructor CRUD details, admin creation by admin, role-based permissions |

---

**Document End**

