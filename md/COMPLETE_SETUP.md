# 🚀 Complete Setup Guide - Get Login Working

## Quick Start (Automated)

Run this PowerShell script to set everything up:

```powershell
cd server
.\setup-database.ps1
```

This script will:
1. ✅ Check if PostgreSQL is installed
2. ✅ Start PostgreSQL service
3. ✅ Create/verify .env file
4. ✅ Create database
5. ✅ Run schema
6. ✅ Create test user
7. ✅ Test connection

## Manual Setup (Step by Step)

### Step 1: Install PostgreSQL (If Not Installed)

1. Download: https://www.postgresql.org/download/windows/
2. Install PostgreSQL
3. **Remember the password** you set for `postgres` user!

### Step 2: Start PostgreSQL

**Check if running:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

**If not running, start it:**
- Press `Win + R` → `services.msc`
- Find "PostgreSQL" service
- Right-click → Start

### Step 3: Create .env File

**Location:** `server/.env`

**Content:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD_HERE

JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
```

**⚠️ IMPORTANT:** Replace `YOUR_POSTGRESQL_PASSWORD_HERE` with your actual PostgreSQL password!

### Step 4: Create Database

```powershell
# Find psql.exe
$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object -First 1

# Connect (will ask for password)
& $psql.FullName -U postgres
```

Then in psql:
```sql
CREATE DATABASE lms_db;
\q
```

### Step 5: Run Database Schema

```powershell
cd server
$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object -First 1
& $psql.FullName -U postgres -d lms_db -f database\schema.sql
```

### Step 6: Create Test User

```powershell
cd server
node create-test-user.js
```

This creates a test user:
- **Email:** test@example.com
- **Password:** test123456
- **Role:** student
- **Email verified:** ✅
- **Admin approved:** ✅

### Step 7: Test Database Connection

```powershell
cd server
node test-db-connection.js
```

Should show: `✅ SUCCESS! Database connected successfully!`

### Step 8: Start Server

```powershell
cd server
npm run dev
```

Check console for:
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

### Step 9: Test Login

1. Go to: http://localhost:5173/pages/auth/login.html
2. Login with:
   - **Email:** test@example.com
   - **Password:** test123456
3. Should redirect to student dashboard! ✅

## Troubleshooting

### Issue: "PostgreSQL not found"
**Solution:** Install PostgreSQL first (Step 1)

### Issue: "Service not running"
**Solution:** Start PostgreSQL service (Step 2)

### Issue: "Password authentication failed"
**Solution:** Check `DB_PASSWORD` in `.env` matches PostgreSQL password

### Issue: "Database does not exist"
**Solution:** Create database (Step 4)

### Issue: "Table does not exist"
**Solution:** Run schema (Step 5)

### Issue: "Cannot connect to server"
**Solution:** 
1. Check PostgreSQL is running
2. Check `.env` file exists and has correct password
3. Run `node test-db-connection.js` to diagnose

## Quick Test Commands

**Test database connection:**
```powershell
cd server
node test-db-connection.js
```

**Create test user:**
```powershell
cd server
node create-test-user.js
```

**Test login endpoint:**
```powershell
cd server
node test-login.js
```

## Summary

After completing all steps:
1. ✅ PostgreSQL installed and running
2. ✅ Database `lms_db` created
3. ✅ Schema run
4. ✅ Test user created
5. ✅ Server running
6. ✅ Login working!

## Test Credentials

**Email:** test@example.com  
**Password:** test123456

You can login immediately after setup!

