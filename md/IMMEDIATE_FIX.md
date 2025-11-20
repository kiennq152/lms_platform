# 🚨 IMMEDIATE FIX: Database Connection Error

## What You're Seeing
**Error:** "Database connection failed. Please check database configuration."

## Root Cause
1. ✅ `.env` file has been created (but needs your PostgreSQL password)
2. ❓ PostgreSQL might not be installed or running
3. ❓ Database `lms_db` might not exist

## Quick Fix (Choose Your Situation)

### Situation A: PostgreSQL is Installed

**Step 1: Start PostgreSQL**
- Press `Win + R`
- Type `services.msc`
- Find "PostgreSQL" service
- Right-click → Start

**Step 2: Update `.env` File**
- Open `server/.env`
- Change `DB_PASSWORD=postgres` to your actual PostgreSQL password
- Save the file

**Step 3: Create Database**
```powershell
# Find PostgreSQL installation path (usually C:\Program Files\PostgreSQL\14\bin)
# Or use full path:
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres

# Then in psql:
CREATE DATABASE lms_db;
\q
```

**Step 4: Run Schema**
```powershell
cd database
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d lms_db -f schema.sql
```

**Step 5: Restart Server**
```powershell
cd server
npm run dev
```

### Situation B: PostgreSQL is NOT Installed

**Step 1: Install PostgreSQL**
1. Download from: https://www.postgresql.org/download/windows/
2. Install it
3. **Remember the password** you set for `postgres` user!
4. Make sure to check "Add PostgreSQL to PATH" during installation

**Step 2: Update `.env` File**
- Open `server/.env`
- Change `DB_PASSWORD=postgres` to the password you set during installation
- Save the file

**Step 3: Create Database**
```powershell
psql -U postgres
CREATE DATABASE lms_db;
\q
```

**Step 4: Run Schema**
```powershell
cd database
psql -U postgres -d lms_db -f schema.sql
```

**Step 5: Restart Server**
```powershell
cd server
npm run dev
```

## Verify It's Working

After restarting server, check console for:
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

## Test Login

Once database is connected:
1. Register a new user (if needed)
2. Verify email (check console for token)
3. Login should work!

## Still Having Issues?

**Check PostgreSQL Installation:**
```powershell
# Try to find PostgreSQL
Get-ChildItem "C:\Program Files" -Filter "*PostgreSQL*" -Directory
Get-ChildItem "C:\Program Files (x86)" -Filter "*PostgreSQL*" -Directory
```

**Check Services:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

**Manual Connection Test:**
```powershell
# Try connecting manually (will ask for password)
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres
```

## Summary

The `.env` file is now created. You need to:
1. ✅ Install PostgreSQL (if not installed)
2. ✅ Start PostgreSQL service
3. ✅ Update `DB_PASSWORD` in `server/.env`
4. ✅ Create `lms_db` database
5. ✅ Run database schema
6. ✅ Restart server

Then login will work!

