# 🚨 URGENT: Fix Database Connection

## Current Error
**"Database connection failed. Please check database configuration."**

This means your server cannot connect to PostgreSQL.

## Quick Fix Steps

### Step 1: Check PostgreSQL is Running

```powershell
Get-Service -Name postgresql*
```

**If not running:**
- Open Services (`Win + R` → type `services.msc`)
- Find "PostgreSQL" service
- Right-click → Start

### Step 2: Create `.env` File

Create file: `server/.env`

**Content:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d

PORT=5173
NODE_ENV=development
CORS_ORIGIN=*
```

**⚠️ IMPORTANT:** Change `DB_PASSWORD` to your actual PostgreSQL password!

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
cd database
psql -U postgres -d lms_db -f schema.sql
```

### Step 5: Restart Server

```powershell
# Stop current server (Ctrl+C)
cd server
npm run dev
```

### Step 6: Test Connection

```powershell
cd server
node test-login.js
```

## Alternative: Use Setup Script

```powershell
cd server
.\setup-env.ps1
```

Then update `DB_PASSWORD` in the created `.env` file.

## Verify Database Connection

After restarting server, check console for:
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

If you see:
- ❌ `Database connection failed` → Check PostgreSQL service and `.env` file

## Still Having Issues?

1. **Check PostgreSQL Password:**
   - Try connecting manually: `psql -U postgres`
   - If it asks for password, use that password in `.env`

2. **Check PostgreSQL Port:**
   - Default is 5432
   - If different, update `DB_PORT` in `.env`

3. **Check Database Name:**
   - Default is `lms_db`
   - If different, update `DB_NAME` in `.env`

4. **Test Connection Manually:**
   ```powershell
   psql -U postgres -d lms_db -c "SELECT 1;"
   ```

## After Fixing

Once database is connected:
1. Register a new user (if needed)
2. Verify email
3. Login should work!

