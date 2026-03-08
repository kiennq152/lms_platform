# User CRUD Operations Audit

## Database Structure

### Users Table Schema
- **Table**: `users`
- **Primary Key**: `user_id`
- **Roles**: `student`, `instructor`, `admin`
- **Status**: `active`, `inactive`, `suspended`

### Key Fields
- `user_id` (PK) - Unique identifier
- `email` (UNIQUE) - User email
- `password_hash` - Hashed password
- `first_name`, `last_name` - User name
- `role` - User role (student/instructor/admin)
- `status` - Account status
- `admin_approved` - Approval status (for instructors/admins)
- `approved_by` (FK) - Admin who approved
- `email_verified` - Email verification status

---

## Current CRUD Operations

### ✅ READ Operations

| Endpoint | Method | Access | Description | Status |
|----------|--------|--------|-------------|--------|
| `/api/users` | GET | Admin | Get all users (with filters) | ✅ Working |
| `/api/users/me` | GET | All | Get current user profile | ✅ Working |

**Missing:**
- ❌ `GET /api/users/:id` - Get user by ID (admin only)

### ✅ UPDATE Operations

| Endpoint | Method | Access | Description | Status |
|----------|--------|--------|-------------|--------|
| `/api/users/me` | PUT | All | Update own profile | ✅ Working |
| `/api/users/:id/status` | PUT | Admin | Update user status | ✅ Working |
| `/api/users/:id/approve` | POST | Admin | Approve user | ✅ Working |
| `/api/users/:id/reject` | POST | Admin | Reject user | ✅ Working |

**Missing:**
- ❌ `PUT /api/users/:id` - Update user by admin
- ❌ `PUT /api/users/:id/password` - Update user password (admin)

### ❌ CREATE Operations

**Missing:**
- ❌ `POST /api/users` - Create user (admin only)
- ❌ Admin should be able to create students, instructors, and other admins

### ✅ DELETE Operations

| Endpoint | Method | Access | Description | Status |
|----------|--------|--------|-------------|--------|
| `/api/users/:id` | DELETE | Admin | Soft delete (set status to inactive) | ✅ Working |

---

## Role-Specific Requirements

### Students
- ✅ Can register themselves (`POST /api/auth/register` with `role=student`)
- ✅ Auto-approved (`admin_approved=true`)
- ✅ Can update own profile (`PUT /api/users/me`)
- ✅ Can view own profile (`GET /api/users/me`)
- ❌ Admin cannot create students directly (missing endpoint)

### Instructors (Teachers)
- ✅ Can register themselves (`POST /api/auth/register` with `role=instructor`)
- ❌ Require admin approval (`admin_approved=false` initially)
- ✅ Can be approved by admin (`POST /api/users/:id/approve`)
- ✅ Can update own profile (`PUT /api/users/me`)
- ✅ Can view own profile (`GET /api/users/me`)
- ❌ Admin cannot create instructors directly (missing endpoint)

### Admins
- ❌ Cannot register themselves (not allowed in registration)
- ✅ Can be created by other admins (according to ERD)
- ❌ Admin cannot create other admins directly (missing endpoint)
- ✅ Can approve users (`POST /api/users/:id/approve`)
- ✅ Can update user status (`PUT /api/users/:id/status`)
- ✅ Can view all users (`GET /api/users`)
- ✅ Can delete users (`DELETE /api/users/:id`)

---

## Missing CRUD Operations

### 1. CREATE User (Admin Only)
```
POST /api/users
Body: {
  email, password, firstName, lastName, role, phone, bio,
  status, admin_approved (optional)
}
```
**Required for:**
- Admin creating students
- Admin creating instructors
- Admin creating other admins

### 2. READ User by ID (Admin Only)
```
GET /api/users/:id
```
**Required for:**
- Admin viewing specific user details
- Admin editing user information

### 3. UPDATE User (Admin Only)
```
PUT /api/users/:id
Body: {
  first_name, last_name, email, phone, bio, role, status, etc.
}
```
**Required for:**
- Admin updating user information
- Admin changing user roles

### 4. UPDATE User Password (Admin Only)
```
PUT /api/users/:id/password
Body: { password }
```
**Required for:**
- Admin resetting user passwords

---

## Recommendations

### High Priority
1. ✅ Add `POST /api/users` - Create user (admin only)
2. ✅ Add `GET /api/users/:id` - Get user by ID (admin only)
3. ✅ Add `PUT /api/users/:id` - Update user (admin only)

### Medium Priority
4. ⚠️ Add `PUT /api/users/:id/password` - Update password (admin only)
5. ⚠️ Add bulk operations (approve/delete multiple users)

### Low Priority
6. ⚠️ Add user statistics endpoint
7. ⚠️ Add user search with advanced filters

---

## ERD Compliance

According to ERD:
- ✅ Admins can create other admins (via `approved_by` FK)
- ✅ Instructors require admin approval
- ✅ Students are auto-approved
- ❌ **Missing**: Admin creation endpoint
- ❌ **Missing**: Admin user management endpoints

---

## Security Considerations

### Current Security
- ✅ Admin-only endpoints use `authorize('admin')` middleware
- ✅ Users can only update their own profile
- ✅ Soft delete preserves data integrity

### Recommended Additions
- ✅ Validate role changes (admin should approve role changes)
- ✅ Log all admin actions (create, update, delete users)
- ✅ Validate email uniqueness on update
- ✅ Prevent self-deletion for admins

---

## Test Coverage Needed

### Unit Tests
- ✅ UserModel methods
- ❌ Admin user creation
- ❌ User update validation

### System Tests
- ✅ User registration
- ✅ User approval/rejection
- ❌ Admin creating users
- ❌ Admin updating users

### Integration Tests
- ✅ User workflow (register → approve → login)
- ❌ Admin user management workflow

---

## Next Steps

1. **Implement Missing Endpoints**
   - Create user endpoint (admin only)
   - Get user by ID endpoint
   - Update user endpoint (admin only)

2. **Update UserModel**
   - Add methods for admin operations
   - Add validation for role changes

3. **Add Tests**
   - Test admin user creation
   - Test user updates
   - Test role changes

4. **Update Documentation**
   - API documentation for new endpoints
   - Admin user management guide

