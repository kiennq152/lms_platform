# Database Setup Guide - Step by Step

## Current Issue
You're seeing: **"Database connection failed. Please check database configuration."**

This means PostgreSQL is either:
1. Not installed
2. Not running
3. Not configured correctly

## Step-by-Step Fix

### Step 1: Check if PostgreSQL is Installed

**Option A: Check Services**
```powershell
Get-Service | Where-Object { $_.Name -like "*postgres*" }
```

**Option B: Check if psql command exists**
```powershell
psql --version
```

**If PostgreSQL is NOT installed:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install it (remember the password you set for `postgres` user!)
3. Make sure to add PostgreSQL to PATH during installation

### Step 2: Start PostgreSQL Service

**Find PostgreSQL Service:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

**Start the Service:**
```powershell
# Replace "postgresql-x64-14" with your actual service name
Start-Service -Name "postgresql-x64-14"
```

**Or use Services GUI:**
- Press `Win + R`
- Type `services.msc`
- Find "PostgreSQL" service
- Right-click → Start

### Step 3: Verify `.env` File Exists

The `.env` file should be at: `server/.env`

**If it doesn't exist**, I've created it for you. **IMPORTANT:** Update the `DB_PASSWORD` with your actual PostgreSQL password!

**Default `.env` content:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=postgres  ← CHANGE THIS!

JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
```

### Step 4: Create Database

**Connect to PostgreSQL:**
```powershell
psql -U postgres
```

**If it asks for password**, enter the password you set during PostgreSQL installation.

**Create database:**
```sql
CREATE DATABASE lms_db;
```

**Exit:**
```sql
\q
```

### Step 5: Run Database Schema

```powershell
cd database
psql -U postgres -d lms_db -f schema.sql
```

**If schema.sql doesn't exist**, check the `database` folder for the correct SQL file name.

### Step 6: Test Database Connection

```powershell
psql -U postgres -d lms_db -c "SELECT 1;"
```

**If this works**, your database is ready!

### Step 7: Restart Server

```powershell
# Stop current server (Ctrl+C if running)
cd server
npm run dev
```

**Check server console for:**
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

**If you see:**
- ❌ `Database connection failed` → Check `.env` file password matches PostgreSQL password

## Common Issues

### Issue 1: "psql: command not found"
**Solution:** PostgreSQL is not in PATH. Add it manually or reinstall PostgreSQL with "Add to PATH" option.

### Issue 2: "password authentication failed"
**Solution:** The password in `.env` doesn't match your PostgreSQL password. Update `DB_PASSWORD` in `.env`.

### Issue 3: "database does not exist"
**Solution:** Run `CREATE DATABASE lms_db;` in psql.

### Issue 4: "connection refused"
**Solution:** PostgreSQL service is not running. Start it from Services.

## Quick Test

After setup, test login with:
```powershell
cd server
node test-login.js
```

This will show if the database connection works.

## Next Steps

Once database is connected:
1. Register a new user at the register page
2. Check server console for verification token
3. Verify email (or set `email_verified = true` manually)
4. Login should work!

## Need Help?

Check these files:
- `QUICK_FIX_LOGIN.md` - Quick troubleshooting
- `LOGIN_TROUBLESHOOTING.md` - Detailed troubleshooting
- `FIX_DATABASE_NOW.md` - Urgent database fix

