# Entity Relationship Diagram (ERD)
## VIAN Academy Learning Management System

**Document Version:** 1.0  
**Date:** 2024-01-20  
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
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp

**Constraints**:
- Email must be unique
- Role must be one of: student, instructor, admin
- Status must be one of: active, inactive, suspended

---

### 2.2 Courses Entity
**Purpose**: Stores course information

**Attributes**:
- `course_id` (PK) - Unique identifier
- `instructor_id` (FK) - Reference to Users (instructor)
- `title` - Course title
- `description` - Course description
- `short_description` - Brief course summary
- `price` - Course price
- `category_id` (FK) - Reference to Categories
- `thumbnail_url` - Course thumbnail image
- `status` - Course status (draft, pending, approved, rejected, published)
- `rating` - Average rating (0-5)
- `total_enrollments` - Number of enrollments
- `total_lessons` - Total number of lessons
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
- **Users → Courses** (One-to-Many): An instructor can create many courses
- **Users → Enrollments** (One-to-Many): A student can have many enrollments
- **Users → Transactions** (One-to-Many): A student can have many transactions
- **Users → Reviews** (One-to-Many): A student can write many reviews
- **Users → Forum Topics** (One-to-Many): A user can create many forum topics
- **Users → Forum Replies** (One-to-Many): A user can write many replies
- **Users → System Logs** (One-to-Many): A user can have many log entries
- **Users → Notifications** (One-to-Many): A user can have many notifications

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
┌─────────────┐
│    Users    │
│─────────────│
│ user_id (PK)│
│ email       │
│ password    │
│ role        │
│ status      │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       │                                             │
┌──────▼──────┐                              ┌──────▼──────┐
│  Courses    │                              │ Enrollments │
│─────────────│                              │─────────────│
│ course_id   │                              │ enrollment_ │
│ instructor_ │◄────────────────────────────│ id          │
│ id (FK)     │                              │ student_id  │
│ title       │                              │ course_id   │
│ price       │                              │ progress    │
│ status      │                              └──────┬──────┘
└──────┬──────┘                                     │
       │                                            │ 1:1
       │ 1:N                                       │
       │                                            │
       ├──────────────┐                   ┌────────▼────────┐
       │              │                   │  Certificates   │
┌──────▼──────┐  ┌────▼──────┐            │─────────────────│
│  Modules    │  │ Lessons   │            │ certificate_id  │
│─────────────│  │───────────│            │ enrollment_id   │
│ module_id   │  │ lesson_id │            └─────────────────┘
│ course_id   │  │ module_id │
│ title       │  │ title     │
└──────┬──────┘  │ video_url │
       │         └───────────┘
       │ 1:N
       │
┌──────▼──────┐
│Lesson Progress│
│──────────────│
│ progress_id  │
│ enrollment_id│
│ lesson_id    │
│ is_completed │
└──────────────┘

┌─────────────┐
│Transactions │
│─────────────│
│ transaction │
│ _id (PK)    │
│ student_id  │
│ course_id   │
│ amount      │
│ status      │
└─────────────┘

┌─────────────┐
│  Categories │
│─────────────│
│ category_id │
│ name        │
│ parent_id   │
└─────────────┘
```

---

## 5. Database Schema

See `database/schema.sql` for the complete SQL schema definition.

### 5.1 Key Relationships Summary

| Parent Entity | Child Entity | Relationship Type | Foreign Key |
|---------------|--------------|-------------------|-------------|
| Users | Courses | One-to-Many | instructor_id |
| Users | Enrollments | One-to-Many | student_id |
| Users | Transactions | One-to-Many | student_id |
| Courses | Modules | One-to-Many | course_id |
| Modules | Lessons | One-to-Many | module_id |
| Enrollments | Lesson Progress | One-to-Many | enrollment_id |
| Enrollments | Certificates | One-to-One | enrollment_id |
| Courses | Categories | Many-to-One | category_id |

---

**Document End**

