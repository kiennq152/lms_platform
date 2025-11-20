# 🚨 Quick Fix: Cannot Login

## The Problem
Login is failing because **database connection is not working**.

## Quick Solution (3 Steps)

### Step 1: Create `.env` File

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

**Or use PowerShell script:**
```powershell
cd server
.\setup-env.ps1
```

### Step 2: Make Sure PostgreSQL is Running

**Check:**
```powershell
Get-Service -Name postgresql*
```

**If not running, start it:**
- Open Services (`Win + R` → `services.msc`)
- Find "PostgreSQL" service
- Right-click → Start

### Step 3: Create Database

```powershell
# Option 1: Using psql
psql -U postgres
CREATE DATABASE lms_db;
\q

# Option 2: Using createdb
createdb -U postgres lms_db
```

### Step 4: Run Database Schema

```powershell
cd database
psql -U postgres -d lms_db -f schema.sql
```

### Step 5: Restart Server

```powershell
# Stop server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

## Test Login

1. **First register** at: `http://localhost:5173/pages/auth/register.html`
2. **Check console** for verification token
3. **Verify email** or manually set `email_verified = true` in database
4. **Login** at: `http://localhost:5173/pages/auth/login.html`

## Still Not Working?

Check server console for:
- `❌ Database connection failed` → Database not running or wrong credentials
- `User not found` → User doesn't exist (register first)
- `Invalid credentials` → Wrong password
- `Please verify your email first` → Email not verified

## Need Help?

See `LOGIN_TROUBLESHOOTING.md` for detailed troubleshooting.

