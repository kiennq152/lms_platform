# 🚨 START POSTGRESQL - Fix 503 Error

## Current Status
✅ `.env` file exists and is configured  
❌ **PostgreSQL is NOT running** (ECONNREFUSED error)

## Quick Fix: Start PostgreSQL

### Method 1: Using Services (Easiest)

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "PostgreSQL" service (might be named like "postgresql-x64-14" or "PostgreSQL 14")
4. Right-click → **Start**
5. Wait for status to change to "Running"

### Method 2: Using PowerShell

**Find PostgreSQL service:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

**Start the service:**
```powershell
# Replace "postgresql-x64-14" with your actual service name
Start-Service -Name "postgresql-x64-14"
```

**Or start all PostgreSQL services:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" } | Start-Service
```

### Method 3: Check if PostgreSQL is Installed

**Check installation:**
```powershell
Get-ChildItem "C:\Program Files" -Filter "*PostgreSQL*" -Directory
Get-ChildItem "C:\Program Files (x86)" -Filter "*PostgreSQL*" -Directory
```

**If NOT installed:**
1. Download: https://www.postgresql.org/download/windows/
2. Install PostgreSQL
3. **Remember the password** you set for `postgres` user!
4. Update `DB_PASSWORD` in `server/.env` with that password

## After Starting PostgreSQL

### Step 1: Verify PostgreSQL is Running

```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" } | Select-Object Name, Status
```

Should show: `Status: Running`

### Step 2: Test Database Connection

```powershell
cd server
node test-db-connection.js
```

**Expected output:**
```
✅ SUCCESS! Database connected successfully!
```

**If still fails:**
- Check `DB_PASSWORD` in `server/.env` matches your PostgreSQL password
- Verify database `lms_db` exists (see below)

### Step 3: Create Database (if needed)

```powershell
# Find psql.exe
$pgPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object -First 1

# Connect and create database
& $pgPath.FullName -U postgres
```

Then in psql:
```sql
CREATE DATABASE lms_db;
\q
```

### Step 4: Run Database Schema (if needed)

```powershell
cd database
$pgPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object -First 1
& $pgPath.FullName -U postgres -d lms_db -f schema.sql
```

### Step 5: Restart Server

```powershell
cd server
npm run dev
```

**Check console for:**
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

## Test Login Again

Once PostgreSQL is running and database is connected:
1. Go to login page
2. Try logging in
3. Should work! ✅

## Troubleshooting

### Issue: "Service not found"
**Solution:** PostgreSQL might not be installed. Install it first.

### Issue: "Access denied" when starting service
**Solution:** Run PowerShell as Administrator:
```powershell
Start-Process powershell -Verb RunAs
```

### Issue: "Password authentication failed"
**Solution:** Update `DB_PASSWORD` in `server/.env` with correct password.

### Issue: "Database does not exist"
**Solution:** Create database: `CREATE DATABASE lms_db;`

## Summary

**The fix is simple:**
1. ✅ `.env` file exists (already done)
2. ⚠️ **Start PostgreSQL service** ← YOU ARE HERE
3. ⚠️ Verify database `lms_db` exists
4. ⚠️ Restart server
5. ✅ Login should work!

Run this to test:
```powershell
cd server
node test-db-connection.js
```

