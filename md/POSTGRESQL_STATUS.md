# PostgreSQL Status Check

## Test Results

**Status:** ❌ PostgreSQL is NOT installed or NOT running

**Error:** `ECONNREFUSED ::1:5432`

This means:
- PostgreSQL service is not running, OR
- PostgreSQL is not installed

## What You Need to Do

### Option 1: Install PostgreSQL (If Not Installed)

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the Windows installer
   - Install PostgreSQL (remember the password you set!)

2. **After Installation:**
   - PostgreSQL service should start automatically
   - Update `server/.env` with your PostgreSQL password
   - Run test again: `cd server && node test-db-connection.js`

### Option 2: Start PostgreSQL Service (If Installed)

**Check if PostgreSQL is installed:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

**If service exists but is stopped:**
```powershell
# Find service name
$pgService = Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" } | Select-Object -First 1

# Start it
Start-Service -Name $pgService.Name

# Verify it's running
Get-Service -Name $pgService.Name
```

**Or use Services GUI:**
- Press `Win + R`
- Type `services.msc`
- Find "PostgreSQL" service
- Right-click → Start

## After PostgreSQL is Running

1. **Test connection:**
   ```powershell
   cd server
   node test-db-connection.js
   ```

2. **Create database (if needed):**
   ```powershell
   psql -U postgres
   CREATE DATABASE lms_db;
   \q
   ```

3. **Run schema:**
   ```powershell
   cd server
   psql -U postgres -d lms_db -f database\schema.sql
   ```

4. **Create test user:**
   ```powershell
   cd server
   node create-test-user.js
   ```

5. **Start server and test login:**
   ```powershell
   cd server
   npm run dev
   ```

## Quick Check Commands

**Check PostgreSQL services:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

**Check installation:**
```powershell
Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files (x86)\PostgreSQL" -ErrorAction SilentlyContinue
```

**Test connection:**
```powershell
cd server
node test-db-connection.js
```

## Summary

**Current Issue:** PostgreSQL is not installed or not running

**Solution:** 
1. Install PostgreSQL OR
2. Start PostgreSQL service

**After fixing:** Run `cd server && node test-db-connection.js` again

