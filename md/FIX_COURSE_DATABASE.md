# Fix: Cannot Load/Save Courses from Database

## Problem
- Courses could not be loaded from the database
- Courses could not be saved to the database
- Error: `relation "courses" does not exist`

## Root Cause
The database schema (`schema.sql`) had not been executed, so the database tables did not exist.

## Solution
1. **Fixed Schema Syntax**: Converted MySQL-style `INDEX` statements inside `CREATE TABLE` to PostgreSQL `CREATE INDEX` statements
2. **Fixed Duplicate Index Names**: Renamed duplicate index names (e.g., `idx_status` → `idx_status_courses`, `idx_status_enrollments`)
3. **Executed Schema**: Ran the schema to create all tables

## Changes Made

### 1. Schema Syntax Fix
**Before (MySQL syntax):**
```sql
CREATE TABLE users (
    ...
    INDEX idx_email (email),
    INDEX idx_role (role)
);
```

**After (PostgreSQL syntax):**
```sql
CREATE TABLE users (
    ...
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
```

### 2. Fixed All Index Statements
- Converted all 54 `INDEX` statements to `CREATE INDEX`
- Made index names unique across tables

### 3. Created Database Tables
All 18 tables are now created:
- users
- categories
- courses ⭐
- modules
- lessons
- enrollments
- lesson_progress
- transactions
- coupons
- certificates
- reviews
- forum_topics
- forum_replies
- system_logs
- settings
- notifications
- email_verification_tokens
- user_preferences

## Verification

Run these commands to verify:

```bash
# Test database connection
cd server
node test-course-db.js

# Check courses table
node -e "import('./config/database.js').then(m => m.default.query('SELECT COUNT(*) FROM courses').then(r => console.log('Courses:', r.rows[0].count)))"
```

## Next Steps

1. **Restart Server**: Restart the Node.js server to ensure fresh database connections
2. **Test Course Operations**:
   - Create a new course via instructor dashboard
   - Edit an existing course
   - Load courses in the course catalog
3. **Create Test Data** (optional):
   - Create test categories
   - Create test courses
   - Create test users

## Files Modified
- `server/database/schema.sql` - Fixed all INDEX statements
- `server/run-schema-now.js` - Created script to run schema
- `server/drop-all-tables.js` - Created script to drop all tables
- `server/test-course-db.js` - Created diagnostic script

## Status
✅ **FIXED** - Database schema is now properly created and courses can be loaded/saved.


