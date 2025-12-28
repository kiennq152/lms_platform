# User CRUD API Documentation

## Overview

Complete CRUD operations for managing users (students, instructors, and admins) in the VIAN Academy LMS.

---

## Endpoints

### 1. Get All Users (Admin Only)

**Endpoint:** `GET /api/users`

**Access:** Admin only

**Query Parameters:**
- `role` (optional) - Filter by role: `student`, `instructor`, `admin`
- `status` (optional) - Filter by status: `active`, `inactive`, `suspended`
- `search` (optional) - Search by email, first name, or last name

**Example:**
```bash
GET /api/users?role=instructor&status=active
GET /api/users?search=john
```

**Response:**
```json
{
  "users": [
    {
      "user_id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "status": "active",
      "email_verified": true,
      "admin_approved": true,
      "created_at": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get User by ID (Admin Only)

**Endpoint:** `GET /api/users/:id`

**Access:** Admin only

**Example:**
```bash
GET /api/users/1
```

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active",
    "email_verified": true,
    "admin_approved": true,
    "created_at": "2024-01-20T10:00:00.000Z"
  }
}
```

---

### 3. Create User (Admin Only)

**Endpoint:** `POST /api/users`

**Access:** Admin only

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "student",
  "phone": "+1234567890",
  "bio": "Bio text",
  "status": "active",
  "adminApproved": true
}
```

**Notes:**
- `email`, `password`, `firstName`, `lastName`, `role` are required
- `role` must be: `student`, `instructor`, or `admin`
- `status` must be: `active`, `inactive`, or `suspended` (default: `active`)
- Students are auto-approved
- Admins created by admins are auto-approved
- Instructors require explicit `adminApproved` if you want them pre-approved

**Example:**
```bash
# Create a student
POST /api/users
{
  "email": "student@example.com",
  "password": "Pass123!",
  "firstName": "Student",
  "lastName": "Name",
  "role": "student"
}

# Create an instructor
POST /api/users
{
  "email": "instructor@example.com",
  "password": "Pass123!",
  "firstName": "Instructor",
  "lastName": "Name",
  "role": "instructor",
  "adminApproved": true
}

# Create an admin (admin only)
POST /api/users
{
  "email": "admin2@example.com",
  "password": "Pass123!",
  "firstName": "Admin",
  "lastName": "Name",
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "user_id": 2,
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "student",
    "status": "active",
    "email_verified": true,
    "admin_approved": true
  }
}
```

---

### 4. Update User (Admin Only)

**Endpoint:** `PUT /api/users/:id`

**Access:** Admin only

**Body:** (all fields optional)
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@example.com",
  "phone": "+1234567890",
  "bio": "Updated bio",
  "role": "instructor",
  "status": "active",
  "adminApproved": true
}
```

**Example:**
```bash
PUT /api/users/1
{
  "firstName": "Updated",
  "role": "instructor",
  "adminApproved": true
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "user_id": 1,
    "email": "updated@example.com",
    "first_name": "Updated",
    "last_name": "Name",
    "role": "instructor",
    "status": "active",
    "admin_approved": true
  }
}
```

---

### 5. Update User Password (Admin Only)

**Endpoint:** `PUT /api/users/:id/password`

**Access:** Admin only

**Body:**
```json
{
  "password": "NewSecurePass123!"
}
```

**Example:**
```bash
PUT /api/users/1/password
{
  "password": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

### 6. Approve User (Admin Only)

**Endpoint:** `POST /api/users/:id/approve`

**Access:** Admin only

**Example:**
```bash
POST /api/users/1/approve
```

**Response:**
```json
{
  "message": "User approved successfully",
  "user": {
    "user_id": 1,
    "admin_approved": true,
    "approved_by": 5,
    "admin_approved_at": "2024-01-20T10:00:00.000Z"
  }
}
```

---

### 7. Reject User (Admin Only)

**Endpoint:** `POST /api/users/:id/reject`

**Access:** Admin only

**Example:**
```bash
POST /api/users/1/reject
```

**Response:**
```json
{
  "message": "User rejected successfully",
  "user": {
    "user_id": 1,
    "admin_approved": false,
    "approved_by": null,
    "admin_approved_at": null
  }
}
```

---

### 8. Update User Status (Admin Only)

**Endpoint:** `PUT /api/users/:id/status`

**Access:** Admin only

**Body:**
```json
{
  "status": "suspended"
}
```

**Valid statuses:** `active`, `inactive`, `suspended`

**Example:**
```bash
PUT /api/users/1/status
{
  "status": "suspended"
}
```

**Response:**
```json
{
  "message": "User status updated successfully",
  "user": {
    "user_id": 1,
    "status": "suspended"
  }
}
```

---

### 9. Delete User (Admin Only) - Soft Delete

**Endpoint:** `DELETE /api/users/:id`

**Access:** Admin only

**Note:** This is a soft delete - sets status to `inactive` instead of actually deleting the record.

**Example:**
```bash
DELETE /api/users/1
```

**Response:**
```json
{
  "message": "User deleted successfully (status set to inactive)",
  "user": {
    "user_id": 1,
    "status": "inactive"
  }
}
```

**Restrictions:**
- Cannot delete admin/guest accounts
- Cannot delete your own account

---

### 10. Get Current User Profile

**Endpoint:** `GET /api/users/me`

**Access:** Authenticated users

**Example:**
```bash
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active",
    "email_verified": true,
    "admin_approved": true
  }
}
```

---

### 11. Update Current User Profile

**Endpoint:** `PUT /api/users/me`

**Access:** Authenticated users

**Body:** (all fields optional)
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+1234567890",
  "bio": "Updated bio",
  "socialLink": "https://linkedin.com/user",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Example:**
```bash
PUT /api/users/me
Authorization: Bearer <token>
{
  "firstName": "Updated",
  "bio": "New bio"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "user_id": 1,
    "first_name": "Updated",
    "bio": "New bio"
  }
}
```

---

## Role-Specific Operations

### Students
- ✅ Can be created by admin
- ✅ Auto-approved on creation
- ✅ Can update own profile
- ✅ Can view own profile

### Instructors (Teachers)
- ✅ Can be created by admin
- ✅ Require admin approval (unless `adminApproved: true` on creation)
- ✅ Can be approved/rejected by admin
- ✅ Can update own profile
- ✅ Can view own profile

### Admins
- ✅ Can be created by other admins
- ✅ Auto-approved on creation
- ✅ Can manage all users
- ✅ Can create other admins
- ✅ Can update own profile
- ✅ Cannot delete themselves

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid role. Must be student, instructor, or admin"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden - Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists with this email"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error details (development mode only)"
}
```

---

## Testing Examples

### Create a Student
```bash
curl -X POST http://localhost:5173/api/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "Student123!",
    "firstName": "Student",
    "lastName": "Name",
    "role": "student"
  }'
```

### Create an Instructor
```bash
curl -X POST http://localhost:5173/api/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "password": "Instructor123!",
    "firstName": "Instructor",
    "lastName": "Name",
    "role": "instructor",
    "adminApproved": true
  }'
```

### Create an Admin
```bash
curl -X POST http://localhost:5173/api/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@example.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "Two",
    "role": "admin"
  }'
```

### Get All Instructors
```bash
curl -X GET "http://localhost:5173/api/users?role=instructor" \
  -H "Authorization: Bearer <admin_token>"
```

### Approve User
```bash
curl -X POST http://localhost:5173/api/users/1/approve \
  -H "Authorization: Bearer <admin_token>"
```

### Update User
```bash
curl -X PUT http://localhost:5173/api/users/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "status": "active"
  }'
```

---

## Security Notes

- All admin endpoints require authentication and admin authorization
- Password hash is never returned in responses
- Email uniqueness is validated
- Self-deletion is prevented for admins
- Admin/guest accounts cannot be deleted
- Soft delete preserves data integrity

