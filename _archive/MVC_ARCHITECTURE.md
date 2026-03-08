# MVC Architecture Documentation

## Overview

The server has been refactored to follow the **Model-View-Controller (MVC)** architectural pattern for better code organization, maintainability, and testability.

## Directory Structure

```
server/
├── models/          # Data access layer (Database operations)
│   ├── BaseModel.js      # Base model with common CRUD operations
│   ├── UserModel.js      # User data operations
│   ├── CourseModel.js    # Course data operations
│   ├── EnrollmentModel.js # Enrollment data operations
│   └── index.js          # Export all models
│
├── controllers/     # Business logic layer (Request/Response handling)
│   ├── AuthController.js    # Authentication logic
│   ├── CourseController.js  # Course management logic
│   └── index.js            # Export all controllers
│
├── services/        # Complex business logic (Optional layer)
│   └── AuthService.js      # Authentication services
│
├── routes/         # Route definitions (HTTP layer)
│   ├── auth.mvc.js         # Auth routes (MVC pattern)
│   ├── courses.mvc.js      # Course routes (MVC pattern)
│   └── ...                 # Other routes
│
├── middleware/     # Express middleware
│   └── auth.js            # Authentication middleware
│
└── config/         # Configuration
    └── database.js         # Database configuration
```

## Architecture Layers

### 1. Models (Data Access Layer)

**Purpose**: Handle all database operations and data access.

**Location**: `server/models/`

**Responsibilities**:
- Database queries
- Data validation at database level
- Relationship management
- Data transformation

**Example**:
```javascript
// UserModel.js
export class UserModel extends BaseModel {
  async findByEmail(email) {
    return await this.findOne({ email });
  }
  
  async createUser(userData) {
    // Hash password, validate, etc.
    return await this.create(userData);
  }
}
```

### 2. Controllers (Business Logic Layer)

**Purpose**: Handle HTTP requests/responses and business logic.

**Location**: `server/controllers/`

**Responsibilities**:
- Request validation
- Call models to get/update data
- Business logic processing
- Response formatting
- Error handling

**Example**:
```javascript
// AuthController.js
export class AuthController {
  async login(req, res) {
    // 1. Validate input
    // 2. Call model to find user
    // 3. Verify password
    // 4. Generate token
    // 5. Return response
  }
}
```

### 3. Routes (HTTP Layer)

**Purpose**: Define URL endpoints and map them to controllers.

**Location**: `server/routes/`

**Responsibilities**:
- Define HTTP routes
- Apply middleware (authentication, validation)
- Call controller methods
- Handle errors

**Example**:
```javascript
// auth.mvc.js
router.post('/login', async (req, res, next) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
});
```

### 4. Services (Complex Business Logic)

**Purpose**: Handle complex business logic that doesn't fit in controllers.

**Location**: `server/services/`

**Responsibilities**:
- Complex calculations
- External API calls
- Business rules
- Reusable business logic

**Example**:
```javascript
// AuthService.js
export class AuthService {
  generateToken(user) {
    // Complex token generation logic
  }
}
```

## Data Flow

```
HTTP Request
    ↓
Routes (auth.mvc.js)
    ↓
Middleware (authentication, validation)
    ↓
Controller (AuthController.login)
    ↓
Service (AuthService) [Optional]
    ↓
Model (UserModel.findByEmail)
    ↓
Database
    ↓
Model returns data
    ↓
Controller processes data
    ↓
HTTP Response
```

## Benefits of MVC Pattern

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Maintainability**: Easy to find and modify code
3. **Testability**: Each layer can be tested independently
4. **Reusability**: Models and services can be reused
5. **Scalability**: Easy to add new features
6. **Team Collaboration**: Different developers can work on different layers

## Migration Guide

### Old Pattern (Routes with Business Logic)
```javascript
// routes/auth.js (OLD)
router.post('/login', async (req, res) => {
  const user = await pool.query('SELECT * FROM users...');
  const isValid = await bcrypt.compare(...);
  // All logic in route
});
```

### New Pattern (MVC)
```javascript
// routes/auth.mvc.js (NEW)
router.post('/login', async (req, res, next) => {
  await AuthController.login(req, res);
});

// controllers/AuthController.js
async login(req, res) {
  const user = await UserModel.findByEmail(email);
  const isValid = await UserModel.verifyPassword(...);
  // Business logic in controller
}

// models/UserModel.js
async findByEmail(email) {
  return await this.findOne({ email });
}
```

## Best Practices

1. **Models**: Only database operations, no business logic
2. **Controllers**: Business logic and request/response handling
3. **Routes**: Only route definitions and middleware
4. **Services**: Complex reusable business logic
5. **Error Handling**: Use try-catch in controllers, propagate to error middleware
6. **Validation**: Use express-validator in routes
7. **Authentication**: Use middleware in routes

## Next Steps

1. Migrate remaining routes to MVC pattern
2. Create models for all entities (Enrollment, Transaction, etc.)
3. Create controllers for all routes
4. Add services for complex business logic
5. Update tests to work with MVC structure

## File Naming Convention

- **Models**: `[Entity]Model.js` (e.g., `UserModel.js`)
- **Controllers**: `[Entity]Controller.js` (e.g., `AuthController.js`)
- **Services**: `[Entity]Service.js` (e.g., `AuthService.js`)
- **Routes**: `[entity].mvc.js` (e.g., `auth.mvc.js`)

