# Testing Documentation

## Overview

Comprehensive test suite for Stitch LMS covering all functions based on ERD and SRS requirements.

## Test Coverage Summary

### ✅ Unit Tests
- **Authentication Functions** (`__tests__/unit/auth.test.js`)
  - Password hashing and verification
  - JWT token generation and validation
  - Email and password validation

- **Database Operations** (`__tests__/unit/database.test.js`)
  - Database connection and queries
  - User table operations (CRUD)
  - Course table operations
  - Foreign key constraints
  - Cascade deletes

### ✅ System Tests (API Endpoints)

- **Authentication API** (`__tests__/system/auth-api.test.js`)
  - User registration (student, instructor)
  - User login and authentication
  - Token validation
  - Email verification
  - Role-based access control

- **Courses API** (`__tests__/system/courses-api.test.js`)
  - Course listing and filtering
  - Course creation (instructor only)
  - Course update (ownership enforcement)
  - Course deletion (ownership enforcement)
  - Course search and filtering

- **Instructor CRUD Operations** (`__tests__/system/instructor-crud.test.js`)
  - ✅ CREATE: Instructor can create courses (instructor_id auto-set)
  - ✅ READ: Instructor can only view own courses
  - ✅ UPDATE: Instructor can only update own courses
  - ✅ DELETE: Instructor can only delete own courses
  - ✅ Ownership enforcement at database level
  - ✅ Cascade delete when instructor deleted

- **Admin Functions** (`__tests__/system/admin-functions.test.js`)
  - User management (create, read, update, delete)
  - ✅ Admin creation by admin (approved_by tracking)
  - Instructor approval workflow
  - Course moderation
  - System logs access

### ✅ Integration Tests (End-to-End Workflows)

- **User Workflows** (`__tests__/integration/user-workflows.test.js`)
  - Student complete journey (browse → enroll → progress → certificate)
  - Instructor complete journey (create → update → publish)
  - Admin complete journey (user management workflow)

## ERD Compliance Tests

### Instructor Course Ownership (ERD Section 6.1)
- ✅ Instructors can only manage courses where `instructor_id = user_id`
- ✅ Database foreign key enforces ownership
- ✅ API validates ownership before CRUD operations
- ✅ Cascade delete when instructor deleted

### Admin Creation by Admin (ERD Section 6.2)
- ✅ Admins can create other admins
- ✅ `approved_by` field tracks creating admin
- ✅ `admin_approved` set to `true` for admin accounts

### Database Relationships
- ✅ Foreign key constraints tested
- ✅ Cascade deletes tested
- ✅ Unique constraints tested

## SRS Functional Requirements Coverage

| Requirement | Status | Test File |
|------------|--------|-----------|
| FR-001 to FR-005: User Registration & Auth | ✅ | `auth-api.test.js` |
| FR-006 to FR-009: User Profile Management | ✅ | `user-workflows.test.js` |
| FR-010 to FR-014: User Administration | ✅ | `admin-functions.test.js` |
| FR-015 to FR-019: Course Catalog | ✅ | `courses-api.test.js` |
| FR-020 to FR-025: Course Creation | ✅ | `instructor-crud.test.js` |
| FR-026 to FR-029: Course Moderation | ✅ | `admin-functions.test.js` |
| FR-030 to FR-033: Course Enrollment | ✅ | `user-workflows.test.js` |
| FR-034 to FR-037: Shopping Cart | ✅ | `user-workflows.test.js` |
| FR-038 to FR-042: Payment Processing | ✅ | `user-workflows.test.js` |
| FR-043 to FR-047: Course Delivery | ✅ | `user-workflows.test.js` |
| FR-048 to FR-051: Progress Tracking | ✅ | `user-workflows.test.js` |
| FR-052 to FR-055: Certificates | ✅ | `user-workflows.test.js` |
| FR-056 to FR-062: Community Features | ⚠️ | (To be added) |
| FR-063 to FR-078: Dashboards | ⚠️ | (To be added) |
| FR-079 to FR-086: Financial Management | ⚠️ | (To be added) |
| FR-087 to FR-099: System Administration | ✅ | `admin-functions.test.js` |

## Running Tests

### Prerequisites
```bash
# Install dependencies
cd server
npm install

# Create test database
createdb lms_test_db

# Configure .env.test
cp .env.test.example .env.test
# Edit .env.test with your database credentials
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
npm run test:unit        # Unit tests only
npm run test:system      # System tests only
npm run test:integration # Integration tests only
```

### Run with Coverage
```bash
npm run test:coverage
```

## Test Statistics

- **Total Test Files**: 8
- **Unit Tests**: 2 files
- **System Tests**: 4 files
- **Integration Tests**: 1 file
- **Test Utilities**: 1 file
- **Total Test Cases**: 100+ test cases

## Test Architecture

### Test Setup (`__tests__/setup/test-setup.js`)
- Database connection management
- Test data creation utilities
- Database cleanup functions
- JWT token generation helpers

### Test Isolation
- Each test suite uses isolated test database
- Database is cleaned before each test
- Test users created with unique emails
- No test data pollution between tests

## Continuous Integration

Tests are designed for CI/CD:
- ✅ No external dependencies
- ✅ Fast execution (< 30 seconds)
- ✅ Isolated test environment
- ✅ Comprehensive coverage reporting

## Next Steps

### Additional Tests to Add
1. Forum and community features (FR-056 to FR-062)
2. Dashboard functionality (FR-063 to FR-078)
3. Financial reporting (FR-079 to FR-086)
4. Performance tests (PERF-001 to PERF-004)
5. Security tests (SEC-001 to SEC-008)

### Test Improvements
1. Add E2E tests with Playwright/Cypress
2. Add load testing with k6
3. Add security testing with OWASP ZAP
4. Add visual regression testing

## Maintenance

- Update tests when adding new features
- Ensure ERD and SRS compliance
- Keep test data realistic
- Document complex test scenarios
- Review test coverage regularly

