# Test Suite Documentation

Comprehensive test suite for Stitch LMS based on ERD and SRS requirements.

## Test Structure

```
__tests__/
├── setup/
│   └── test-setup.js          # Test utilities and database setup
├── unit/
│   ├── auth.test.js            # Authentication unit tests
│   └── database.test.js        # Database operation unit tests
├── system/
│   ├── auth-api.test.js       # Authentication API tests
│   ├── courses-api.test.js    # Courses API tests
│   ├── instructor-crud.test.js # Instructor CRUD operations (ERD compliance)
│   └── admin-functions.test.js # Admin function tests
└── integration/
    └── user-workflows.test.js  # End-to-end workflow tests
```

## Test Categories

### Unit Tests
- **Purpose**: Test individual functions in isolation
- **Coverage**: Password hashing, JWT generation, database queries
- **Location**: `__tests__/unit/`

### System Tests
- **Purpose**: Test API endpoints and system components
- **Coverage**: All API routes, authentication, authorization
- **Location**: `__tests__/system/`

### Integration Tests
- **Purpose**: Test complete user workflows end-to-end
- **Coverage**: Student journey, instructor workflow, admin operations
- **Location**: `__tests__/integration/`

## Running Tests

### Prerequisites
1. Install dependencies:
```bash
cd server
npm install
```

2. Set up test database:
```bash
# Create test database
createdb lms_test_db

# Or set TEST_DB_NAME in .env.test
```

3. Configure test environment:
```bash
# Create .env.test file
DB_HOST=localhost
DB_PORT=5432
TEST_DB_NAME=lms_test_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=test-secret-key
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# System tests only
npm run test:system

# Integration tests only
npm run test:integration
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Coverage

### ERD Compliance Tests
- ✅ Instructor CRUD operations (ownership enforcement)
- ✅ Admin creation by admin (approved_by tracking)
- ✅ Foreign key constraints and cascade deletes
- ✅ Database schema validation

### SRS Functional Requirements
- ✅ FR-001 to FR-102: All functional requirements covered
- ✅ User registration and authentication
- ✅ Course management (CRUD)
- ✅ Enrollment and payment processing
- ✅ Progress tracking and certificates
- ✅ Admin functions and system management

### API Endpoints Tested
- ✅ `/api/auth/*` - Authentication endpoints
- ✅ `/api/courses/*` - Course management
- ✅ `/api/instructor/*` - Instructor-specific endpoints
- ✅ `/api/users/*` - User management (admin)
- ✅ `/api/enrollments/*` - Enrollment management
- ✅ `/api/cart/*` - Shopping cart
- ✅ `/api/transactions/*` - Payment processing
- ✅ `/api/certificates/*` - Certificate management
- ✅ `/api/system-logs/*` - System logging

## Test Data

Tests use isolated test database and clean up after each test:
- Database is truncated before each test suite
- Test users are created with unique emails (timestamp-based)
- All test data is automatically cleaned up

## Writing New Tests

### Unit Test Example
```javascript
import { describe, it, expect } from '@jest/globals';

describe('My Function', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### System Test Example
```javascript
import request from 'supertest';
import { createTestUser, getAuthToken } from '../setup/test-setup.js';

describe('My API Endpoint', () => {
  it('should return data', async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });
});
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env.test`
- Verify test database exists: `psql -l | grep lms_test_db`

### Test Failures
- Check test database is clean: `npm run test` (auto-cleans)
- Verify environment variables are set correctly
- Check database schema is up to date

### Coverage Issues
- Run `npm run test:coverage` to see coverage report
- Check `coverage/` directory for HTML report

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Isolated test database
- No external dependencies
- Fast execution
- Comprehensive coverage

## Test Maintenance

- Update tests when adding new features
- Ensure ERD and SRS compliance
- Keep test data realistic
- Document complex test scenarios

