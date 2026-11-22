# User Account Setup Guide

This guide explains how to create different types of user accounts (Admin, Instructor/Teacher, and Student) for the LMS system.

## Quick Start

### Create Admin Account
```bash
cd server
npm run create-admin
```

### Create Instructor/Teacher Account
```bash
cd server
npm run create-instructor
```

### Create Student Account
```bash
cd server
npm run create-student
```

---

## Admin Account

### Default Admin Account
```bash
npm run create-admin
```
Creates:
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Status:** `active`
- **Email Verified:** `true`
- **Admin Approved:** `true`

### Custom Admin Account
```bash
node create-admin-user.js admin@lms.com SecurePassword123!
```

Or using environment variables:
```bash
ADMIN_EMAIL=admin@lms.com ADMIN_PASSWORD=SecurePassword123! npm run create-admin
```

**Features:**
- ✅ Bypasses email verification
- ✅ Bypasses admin approval
- ✅ Can login immediately
- ✅ Full system access

---

## Instructor/Teacher Account

### Default Instructor Account
```bash
npm run create-instructor
```
Creates:
- **Email:** `teacher@example.com`
- **Password:** `teacher123`
- **Role:** `instructor`
- **Status:** `active`
- **Email Verified:** `false` (requires verification)
- **Admin Approved:** `false` (requires approval)

### Custom Instructor Account
```bash
node create-instructor.js teacher@example.com password123
```

### Auto-Approved Instructor (for testing)
```bash
AUTO_APPROVE=true node create-instructor.js teacher@example.com password123
```

Or using environment variables:
```bash
EMAIL=teacher@example.com PASSWORD=password123 AUTO_APPROVE=true npm run create-instructor
```

**Features:**
- ⚠️ Requires admin approval before login (unless AUTO_APPROVE=true)
- ⚠️ Requires email verification (unless AUTO_APPROVE=true)
- ✅ Can create and manage courses
- ✅ Access to instructor dashboard

**Note:** By default, instructor accounts require admin approval. To approve an instructor:
1. Login as admin
2. Use API: `POST /api/users/:id/approve`
3. Or use the admin dashboard

---

## Student Account

### Default Student Account
```bash
npm run create-student
```
Creates:
- **Email:** `student@example.com`
- **Password:** `student123`
- **Role:** `student`
- **Status:** `active`
- **Email Verified:** `true` (auto-verified)
- **Admin Approved:** `true` (auto-approved)

### Custom Student Account
```bash
node create-student.js student@example.com password123
```

Or using environment variables:
```bash
EMAIL=student@example.com PASSWORD=password123 npm run create-student
```

**Features:**
- ✅ Auto-approved (no admin approval needed)
- ✅ Auto-verified (no email verification needed)
- ✅ Can login immediately
- ✅ Can enroll in courses
- ✅ Can access student dashboard

---

## Unified User Creation Script

You can also use the unified script to create any type of account:

```bash
# Create admin
node create-user.js admin admin@example.com password123

# Create instructor
node create-user.js instructor teacher@example.com password123

# Create student
node create-user.js student student@example.com password123
```

Or using environment variables:
```bash
ROLE=instructor EMAIL=teacher@example.com PASSWORD=password123 node create-user.js
```

---

## Account Comparison

| Feature | Admin | Instructor | Student |
|---------|-------|------------|---------|
| Email Verification | ✅ Auto | ⚠️ Required | ✅ Auto |
| Admin Approval | ✅ Auto | ⚠️ Required | ✅ Auto |
| Can Login Immediately | ✅ Yes | ❌ No* | ✅ Yes |
| Create Courses | ✅ Yes | ✅ Yes | ❌ No |
| Manage Users | ✅ Yes | ❌ No | ❌ No |
| Enroll in Courses | ✅ Yes | ✅ Yes | ✅ Yes |
| Access Dashboard | ✅ Yes | ✅ Yes | ✅ Yes |

*Instructor can login immediately if created with `AUTO_APPROVE=true`

---

## Login Credentials Summary

### Default Test Accounts

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Instructor (requires approval):**
- Email: `teacher@example.com`
- Password: `teacher123`

**Instructor (auto-approved):**
- Email: `teacher.approved@example.com`
- Password: `teacher123`

**Student:**
- Email: `student@example.com`
- Password: `student123`

---

## Login API

All accounts can login using:

**Endpoint:**
```
POST http://localhost:5173/api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "User",
    "last_name": "Name",
    "role": "admin|instructor|student",
    "status": "active",
    "email_verified": true,
    "admin_approved": true
  }
}
```

---

## Updating Existing Accounts

All scripts will update existing accounts if the email already exists. They will:
- Update the password
- Update the role (if changed)
- Set status to `active`
- Update email verification and approval flags

---

## Environment Variables

### Admin Account
- `ADMIN_EMAIL` - Admin email address
- `ADMIN_PASSWORD` - Admin password
- `ADMIN_FIRST_NAME` - Admin first name (default: "Admin")
- `ADMIN_LAST_NAME` - Admin last name (default: "User")

### Instructor Account
- `EMAIL` or `INSTRUCTOR_EMAIL` - Instructor email
- `PASSWORD` or `INSTRUCTOR_PASSWORD` - Instructor password
- `FIRST_NAME` or `INSTRUCTOR_FIRST_NAME` - First name (default: "Teacher")
- `LAST_NAME` or `INSTRUCTOR_LAST_NAME` - Last name (default: "User")
- `PHONE` or `INSTRUCTOR_PHONE` - Phone number (optional)
- `BIO` or `INSTRUCTOR_BIO` - Bio text (optional)
- `AUTO_APPROVE` - Set to "true" to auto-approve (default: false)

### Student Account
- `EMAIL` or `STUDENT_EMAIL` - Student email
- `PASSWORD` or `STUDENT_PASSWORD` - Student password
- `FIRST_NAME` or `STUDENT_FIRST_NAME` - First name (default: "Student")
- `LAST_NAME` or `STUDENT_LAST_NAME` - Last name (default: "User")
- `PHONE` or `STUDENT_PHONE` - Phone number (optional)

---

## Troubleshooting

### Database Connection Error
Make sure PostgreSQL is running and check your `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### User Already Exists
The scripts will update existing users. If you want a different account, use a different email address.

### Instructor Cannot Login
Instructor accounts require admin approval. Either:
1. Create with `AUTO_APPROVE=true`
2. Have an admin approve the account via API or dashboard

### Invalid Email Format
Use a valid email address format: `user@example.com`

---

## Security Notes

⚠️ **IMPORTANT:**
1. Change default passwords immediately after first login
2. Use strong passwords (at least 12 characters, mix of letters, numbers, symbols)
3. Never commit credentials to version control
4. In production, use environment variables for all credentials
5. Regularly rotate passwords

---

## Examples

### Create Multiple Test Accounts
```bash
# Admin
npm run create-admin

# Auto-approved instructor
AUTO_APPROVE=true npm run create-instructor teacher1@test.com pass123

# Regular instructor (needs approval)
npm run create-instructor teacher2@test.com pass123

# Students
npm run create-student student1@test.com pass123
npm run create-student student2@test.com pass123
```

### Create Accounts via Unified Script
```bash
node create-user.js admin admin@test.com admin123
node create-user.js instructor teacher@test.com teacher123
node create-user.js student student@test.com student123
```

---

**Last Updated:** 2024-01-20  
**Version:** 1.0


