# Quick Account Setup Reference

## 🚀 Quick Commands

### Create Accounts
```bash
cd server

# Admin account
npm run create-admin

# Instructor/Teacher account
npm run create-instructor

# Student account
npm run create-student
```

### Create Custom Accounts
```bash
# Admin
node create-admin-user.js admin@lms.com password123

# Instructor (requires approval)
node create-instructor.js teacher@lms.com password123

# Instructor (auto-approved for testing)
AUTO_APPROVE=true node create-instructor.js teacher@lms.com password123

# Student
node create-student.js student@lms.com password123
```

---

## 📋 Default Test Accounts

| Role | Email | Password | Can Login? |
|------|-------|----------|------------|
| **Admin** | `admin@example.com` | `admin123` | ✅ Yes |
| **Instructor** | `teacher.approved@example.com` | `teacher123` | ✅ Yes |
| **Instructor** | `teacher@example.com` | `teacher123` | ❌ Needs Approval |
| **Student** | `student@example.com` | `student123` | ✅ Yes |

---

## 🔐 Login

**API Endpoint:**
```
POST http://localhost:5173/api/auth/login
```

**Request:**
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
    "role": "admin",
    "status": "active"
  }
}
```

---

## 📚 Full Documentation

- **Complete Guide:** `docs/USER_ACCOUNT_SETUP.md`
- **Admin Setup:** `docs/ADMIN_SETUP.md`
- **API Documentation:** `docs/POSTMAN_API_LIST.md`

---

**Last Updated:** 2024-01-20


