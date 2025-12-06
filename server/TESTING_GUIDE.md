# Complete Testing Guide

## 🧪 Testing Overview

This guide covers all ways to test the Stitch LMS application:
- **Unit Tests** - Test individual functions
- **System Tests** - Test API endpoints
- **Integration Tests** - Test complete workflows
- **Manual Testing** - Test in browser/Postman
- **OTP Testing** - Test OTP login functionality

---

## 📋 Prerequisites

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Up Test Database

**Option A: Create separate test database (Recommended)**
```bash
# Create test database
createdb lms_test_db

# Or using psql
psql -U postgres
CREATE DATABASE lms_test_db;
\q
```

**Option B: Use existing database**
- Tests will clean up data automatically

### 3. Configure Test Environment

Create `server/.env.test` file:
```env
# Test Database Configuration
DB_HOST=localhost
DB_PORT=5432
TEST_DB_NAME=lms_test_db
DB_NAME=lms_test_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=test-secret-key

# Application Configuration
NODE_ENV=test
PORT=5174

# Email Configuration (for OTP tests)
EMAIL_USER=test@example.com
EMAIL_PASSWORD=test-password
```

---

## 🧪 Automated Tests

### Run All Tests
```bash
cd server
npm test
```

### Run Specific Test Categories

**Unit Tests Only:**
```bash
npm run test:unit
```

**System/API Tests Only:**
```bash
npm run test:system
```

**Integration Tests Only:**
```bash
npm run test:integration
```

### Run Tests with Coverage
```bash
npm run test:coverage
```
This generates:
- Text report in terminal
- HTML report in `server/coverage/`
- LCOV report for CI/CD

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

---

## 🔍 Test Categories Explained

### 1. Unit Tests (`__tests__/unit/`)

Test individual functions in isolation:

**Files:**
- `auth.test.js` - Password hashing, JWT, validation
- `database.test.js` - Database operations, CRUD

**Example:**
```bash
npm run test:unit
```

**What it tests:**
- ✅ Password hashing and verification
- ✅ JWT token generation and validation
- ✅ Email validation
- ✅ Database CRUD operations
- ✅ Foreign key constraints

### 2. System Tests (`__tests__/system/`)

Test API endpoints and system components:

**Files:**
- `auth-api.test.js` - Authentication endpoints
- `courses-api.test.js` - Course management endpoints
- `instructor-crud.test.js` - Instructor CRUD operations
- `admin-functions.test.js` - Admin functions

**Example:**
```bash
npm run test:system
```

**What it tests:**
- ✅ User registration and login
- ✅ Course creation, update, delete
- ✅ Instructor ownership enforcement
- ✅ Admin user management
- ✅ API error handling

### 3. Integration Tests (`__tests__/integration/`)

Test complete end-to-end workflows:

**Files:**
- `user-workflows.test.js` - Complete user journeys

**Example:**
```bash
npm run test:integration
```

**What it tests:**
- ✅ Student enrollment workflow
- ✅ Instructor course creation workflow
- ✅ Admin user management workflow
- ✅ Payment and certificate flow

---

## 🖥️ Manual Testing

### 1. Start the Server

```bash
cd server
npm run dev
```

Server will start on `http://localhost:5173`

### 2. Test Health Check

```bash
curl http://localhost:5173/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "database": "connected"
}
```

### 3. Test Authentication

#### Register New User
```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

#### Login with Password
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### Request OTP
```bash
curl -X POST http://localhost:5173/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**In development mode**, response includes OTP:
```json
{
  "message": "OTP code has been sent to your email.",
  "otp": "123456",
  "note": "OTP shown only in development mode"
}
```

#### Login with OTP
```bash
curl -X POST http://localhost:5173/api/auth/login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### 4. Test Protected Routes

Get token from login, then use it:

```bash
# Save token from login response
TOKEN="your-jwt-token-here"

# Get current user
curl http://localhost:5173/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get courses
curl http://localhost:5173/api/courses \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Course Management

#### Create Course (Instructor/Admin only)
```bash
curl -X POST http://localhost:5173/api/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "Course description",
    "short_description": "Short desc",
    "price": 99.99,
    "status": "draft"
  }'
```

#### Get All Courses
```bash
curl http://localhost:5173/api/courses
```

#### Get Course by ID
```bash
curl http://localhost:5173/api/courses/1
```

---

## 🌐 Browser Testing

### 1. Open Application

Navigate to: `http://localhost:5173`

### 2. Test Login Page

1. Go to login page
2. Try password login
3. Try OTP login:
   - Click "Login with OTP"
   - Enter email
   - Check email for OTP (or check dev console/network tab)
   - Enter OTP code

### 3. Test Registration

1. Go to registration page
2. Fill in form
3. Submit
4. Check for success message

### 4. Test Dashboard

1. Login successfully
2. Navigate to dashboard
3. Test all features:
   - View courses
   - Enroll in courses
   - View profile
   - etc.

---

## 📧 Testing OTP Email

### Setup Gmail (Required for email sending)

1. **Enable 2-Step Verification**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Generate password for "Mail"
   - Copy 16-character password

3. **Add to `.env`**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

### Test OTP Email Sending

```bash
# Request OTP
curl -X POST http://localhost:5173/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'

# Check your email inbox for OTP code
# Use the code to login
```

### Development Mode

In `NODE_ENV=development`, OTP is also returned in API response:
```json
{
  "message": "OTP code has been sent to your email.",
  "otp": "123456",
  "expiresIn": 10
}
```

---

## 🐛 Debugging Tests

### View Test Output

Tests show detailed output:
```bash
npm test -- --verbose
```

### Run Single Test File

```bash
# Run only auth tests
npm test -- __tests__/unit/auth.test.js
```

### Debug Failed Tests

1. **Check error messages** in test output
2. **Check database connection**:
   ```bash
   psql -U postgres -d lms_test_db -c "SELECT 1;"
   ```
3. **Check environment variables**:
   ```bash
   # In test, check if .env.test is loaded
   ```

### Common Issues

**Issue: Database connection failed**
```bash
# Solution: Check database is running
pg_isready -U postgres

# Check credentials in .env.test
```

**Issue: Tests timeout**
```bash
# Solution: Increase timeout in test files
jest.setTimeout(10000); // 10 seconds
```

**Issue: OTP tests fail**
```bash
# Solution: Check email configuration
# In development, OTP is returned in response
# Check server logs for email errors
```

---

## 📊 Test Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

### View HTML Report

Open `server/coverage/lcov-report/index.html` in browser

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **System Tests**: 70%+ coverage
- **Integration Tests**: Critical paths covered

---

## 🔄 Continuous Testing

### Watch Mode

Automatically rerun tests on file changes:
```bash
npm run test:watch
```

### Pre-commit Testing

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
cd server
npm test
```

---

## 📝 Test Checklist

### Authentication Tests
- [ ] User registration
- [ ] User login (password)
- [ ] User login (OTP)
- [ ] Email verification
- [ ] Token validation
- [ ] Password reset

### Course Tests
- [ ] Create course
- [ ] Update course
- [ ] Delete course
- [ ] List courses
- [ ] Search courses
- [ ] Instructor ownership

### Admin Tests
- [ ] User management
- [ ] Course moderation
- [ ] System logs
- [ ] Admin creation

### Integration Tests
- [ ] Student enrollment flow
- [ ] Instructor workflow
- [ ] Admin workflow
- [ ] Payment flow

---

## 🚀 Quick Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific category
npm run test:unit
npm run test:system
npm run test:integration

# Watch mode
npm run test:watch

# Single test file
npm test -- __tests__/unit/auth.test.js

# Verbose output
npm test -- --verbose
```

---

## 📚 Additional Resources

- **Test Documentation**: `server/__tests__/README.md`
- **OTP Setup**: `server/docs/OTP_SETUP.md`
- **MVC Architecture**: `server/MVC_ARCHITECTURE.md`
- **Testing Documentation**: `docs/TESTING.md`

---

## 💡 Tips

1. **Use test database** - Don't test on production data
2. **Clean up after tests** - Tests auto-clean, but verify
3. **Check logs** - Server logs show detailed errors
4. **Development mode** - Use for easier OTP testing
5. **Coverage reports** - Review to find untested code

---

## 🆘 Need Help?

1. Check test output for error messages
2. Verify database connection
3. Check environment variables
4. Review test files for examples
5. Check server logs for runtime errors

Happy Testing! 🎉

