# Authentication API Documentation

## Overview

The authentication API provides endpoints for user registration, login, email verification, and user management.

## Base URL

```
http://localhost:5173/api/auth
```

## Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user (student or instructor).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",  // or "instructor"
  "phone": "+1234567890",  // optional
  "bio": "User bio"  // optional
}
```

**Response (201):**
```json
{
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "email_verified": false,
    "admin_approved": true
  },
  "verificationToken": "jwt-token-here"
}
```

**Error Responses:**
- `400` - Validation errors or user already exists
- `500` - Internal server error

**Example Error Response (400):**
```json
{
  "error": "User already exists"
}
```

**Example Error Response (400 - Validation):**
```json
{
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 6 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

---

### 2. Login

**POST** `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "jwt-token-here",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active",
    "avatar_url": null,
    "email_verified": true,
    "admin_approved": true
  }
}
```

**Error Responses:**
- `400` - Validation errors
- `401` - Invalid credentials
- `403` - Email not verified or instructor not approved
- `500` - Internal server error

---

### 3. Verify Email

**POST** `/api/auth/verify-email`

Verify user's email address using verification token.

**Request Body:**
```json
{
  "token": "verification-token-from-email"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `500` - Internal server error

---

### 4. Resend Verification Email

**POST** `/api/auth/resend-verification`

Resend verification email to user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent",
  "verificationToken": "new-jwt-token"
}
```

**Error Responses:**
- `400` - Email already verified or validation errors
- `404` - User not found
- `500` - Internal server error

---

### 5. Get Current User

**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active",
    "avatar_url": null,
    "email_verified": true,
    "admin_approved": true
  }
}
```

**Error Responses:**
- `401` - No token provided or invalid token
- `404` - User not found
- `500` - Internal server error

---

## Authentication Flow

### Registration Flow:
1. User submits registration form
2. API creates user with `email_verified = false`
3. API generates verification token
4. User receives email with verification link
5. User clicks link → verifies email
6. For instructors: Admin must approve account
7. User can now login

### Login Flow:
1. User submits email and password
2. API validates credentials
3. API checks email verification status
4. For instructors: API checks admin approval
5. API returns JWT token
6. Client stores token for subsequent requests

---

## Client-Side Usage

### Using the API Service

```javascript
// Register
const response = await api.register({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student'
});

// Login
const response = await api.login('user@example.com', 'password123');
// Token is automatically stored

// Verify Email
await api.verifyEmail('verification-token');

// Resend Verification
await api.resendVerification('user@example.com');

// Get Current User
const { user } = await api.getCurrentUser();
```

---

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt (10 rounds)
2. **JWT Tokens**: Secure token-based authentication
3. **Email Verification**: Required before login
4. **Admin Approval**: Instructors require admin approval
5. **Token Expiration**: Verification tokens expire after 24 hours
6. **Input Validation**: All inputs are validated and sanitized

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

For validation errors:
```json
{
  "errors": [
    {
      "msg": "Invalid email",
      "param": "email",
      "location": "body"
    }
  ]
}
```

---

## Notes

- Students are auto-approved (`admin_approved = true`)
- Instructors require admin approval (`admin_approved = false` initially)
- Email verification is required for all users before login
- JWT tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- Verification tokens expire after 24 hours

