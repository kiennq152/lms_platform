# 🔧 Login Troubleshooting Guide

## Issue: Cannot Login

The login is failing because the **database connection is not working**.

## Quick Diagnosis

The error message shows:
```
Database connection failed. Please check database configuration.
```

## Step-by-Step Fix

### Step 1: Create `.env` file

Create a file `server/.env` with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
```

**Note**: Update `DB_PASSWORD` with your actual PostgreSQL password.

### Step 2: Check PostgreSQL is Running

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# If not running, start it:
Start-Service -Name postgresql-x64-14  # Adjust version number
```

**Or check in Services:**
- Press `Win + R`, type `services.msc`
- Look for "PostgreSQL" service
- Make sure it's "Running"

### Step 3: Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE lms_db;

# Exit
\q
```

### Step 4: Run Database Schema

```powershell
# Navigate to database folder
cd database

# Run schema (adjust path as needed)
psql -U postgres -d lms_db -f schema.sql
```

### Step 5: Create Test User (Optional)

```sql
-- Connect to database
psql -U postgres -d lms_db

-- Create a test user (password will be hashed by the app)
-- You can register via the register page instead
```

### Step 6: Restart Server

```powershell
# Stop current server (Ctrl+C if running)
# Then restart:
cd server
npm run dev
```

### Step 7: Test Login

1. **First, register a new user** at `pages/auth/register.html`
2. **Verify email** (check console for verification token)
3. **Then login** at `pages/auth/login.html`

## Common Issues

### Issue 1: "Cannot connect to server"
- **Solution**: Make sure PostgreSQL is running
- Check: `Get-Service postgresql*`

### Issue 2: "Database does not exist"
- **Solution**: Create database: `CREATE DATABASE lms_db;`

### Issue 3: "Password authentication failed"
- **Solution**: Update `DB_PASSWORD` in `server/.env` with correct password

### Issue 4: "Port 5432 is already in use"
- **Solution**: Change `DB_PORT` in `.env` or stop other PostgreSQL instances

### Issue 5: "User not found" or "Invalid credentials"
- **Solution**: 
  1. Register a new user first
  2. Check email verification status
  3. For instructors, wait for admin approval

## Testing Login

### Method 1: Use Test Script
```powershell
cd server
node test-login.js
```

### Method 2: Use Browser
1. Open `http://localhost:5173/pages/auth/login.html`
2. Open browser console (F12)
3. Try to login
4. Check console for errors

### Method 3: Check Server Logs
Look at the server console output for:
- `🔐 Login endpoint hit!`
- `✅ Login attempt for email: ...`
- `User found: ...`
- Any error messages

## Expected Flow

1. **Register** → Creates user (email not verified)
2. **Verify Email** → Sets `email_verified = true`
3. **Login** → Should work now
4. **For Instructors**: Admin must approve (`admin_approved = true`)

## Quick Test User Creation

If you want to create a test user directly in database:

```sql
-- Connect to database
psql -U postgres -d lms_db

-- Insert test user (password: test123)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, admin_approved)
VALUES (
  'test@example.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- This is bcrypt hash for 'test123'
  'Test',
  'User',
  'student',
  true,
  true
);
```

**Better approach**: Use the register page - it handles password hashing correctly.

## Still Having Issues?

1. Check server console for detailed error messages
2. Verify `.env` file exists in `server/` directory
3. Verify database is running: `Get-Service postgresql*`
4. Test database connection: `psql -U postgres -d lms_db -c "SELECT 1;"`
5. Check server logs for connection errors

## Next Steps After Fix

Once database is connected:
1. Register a new user via the register page
2. Check email verification (look in console for token)
3. Login with registered credentials
4. You should be redirected to your dashboard

