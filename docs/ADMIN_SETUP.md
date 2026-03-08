# Admin Account Setup Guide

This guide explains how to create an admin account for the LMS system.

## Quick Start

### Option 1: Using npm script (Recommended)

```bash
cd server
npm run create-admin
```

This will create a default admin account with:
- **Email:** `admin@example.com`
- **Password:** `admin123`

### Option 2: Custom Email and Password

```bash
cd server
node create-admin-user.js your-email@example.com your-password
```

Example:
```bash
node create-admin-user.js admin@lms.com SecurePassword123!
```

### Option 3: Using Environment Variables

```bash
cd server
ADMIN_EMAIL=admin@lms.com ADMIN_PASSWORD=SecurePassword123! node create-admin-user.js
```

You can also set additional environment variables:
- `ADMIN_EMAIL` - Admin email address
- `ADMIN_PASSWORD` - Admin password (min 6 characters)
- `ADMIN_FIRST_NAME` - Admin first name (default: "Admin")
- `ADMIN_LAST_NAME` - Admin last name (default: "User")

## Admin Account Features

Admin accounts have the following characteristics:

1. **Role:** `admin`
2. **Status:** `active`
3. **Email Verified:** `true` (bypasses email verification)
4. **Admin Approved:** `true` (bypasses approval process)
5. **Special Login:** Admin accounts can login without email verification or approval

## Login

After creating an admin account, you can login using:

**API Endpoint:**
```
POST http://localhost:5173/api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "user_id": 1,
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "status": "active",
    "email_verified": true,
    "admin_approved": true
  }
}
```

## Updating Existing Admin Account

If an admin account already exists, the script will:
- Update the password
- Ensure the role is set to `admin`
- Set status to `active`
- Enable email verification and admin approval flags

## Security Notes

⚠️ **IMPORTANT:**
1. Change the default password immediately after first login
2. Use a strong password (at least 12 characters, mix of letters, numbers, and symbols)
3. Never commit admin credentials to version control
4. In production, use environment variables for admin credentials

## Troubleshooting

### Database Connection Error

If you see a database connection error:
1. Make sure PostgreSQL is running
2. Check your `.env` file in the `server/` directory
3. Verify database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lms_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### User Already Exists

If the email already exists, the script will update the existing user to admin role. If you want to create a different admin account, use a different email address.

### Invalid Email Format

The script validates email format. Use a valid email address like `admin@example.com` or the special value `admin` (for development only).

## Admin Permissions

Admin accounts have access to:
- All user management endpoints (`/api/users`)
- All course management endpoints (`/api/courses`)
- System settings (`/api/settings`)
- System logs (`/api/system-logs`)
- Financial reports (`/api/transactions/reports`)
- Instructor dashboard features
- All student features

## Testing Admin Login

You can test admin login using Postman or curl:

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Multiple Admin Accounts

You can create multiple admin accounts by running the script with different email addresses:

```bash
node create-admin-user.js admin1@example.com password1
node create-admin-user.js admin2@example.com password2
```

---

---

## Related Documentation

- **User Account Setup Guide:** See `docs/USER_ACCOUNT_SETUP.md` for creating instructor and student accounts
- **Postman API List:** See `docs/POSTMAN_API_LIST.md` for all available API endpoints

---

**Last Updated:** 2024-01-20  
**Version:** 1.0

