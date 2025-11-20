# 🚨 CREATE .env FILE NOW

## The Problem
You're getting 503 error because **`.env` file is missing**!

## Solution: Create `.env` File

### Step 1: Create the File

**Location:** `server/.env`

**Method 1: Using PowerShell (Run in project root)**
```powershell
cd server
@"
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
"@ | Out-File -FilePath ".env" -Encoding utf8
```

**Method 2: Manual Creation**
1. Open `server` folder
2. Create new file named `.env` (no extension!)
3. Copy and paste this content:

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

**Method 3: Use Setup Script**
```powershell
cd server
.\setup-env.ps1
```

### Step 2: Update PostgreSQL Password

**⚠️ IMPORTANT:** Change `DB_PASSWORD=postgres` to your actual PostgreSQL password!

If you don't know your PostgreSQL password:
1. Try connecting: `psql -U postgres`
2. If it asks for password, that's the password you need
3. If it connects without password, use `postgres` or leave it empty

### Step 3: Verify File Created

```powershell
cd server
if (Test-Path ".env") { 
    Write-Host "✅ .env file exists!" 
    Get-Content ".env" 
} else { 
    Write-Host "❌ .env file NOT found" 
}
```

### Step 4: Test Database Connection

```powershell
cd server
node test-db-connection.js
```

This will tell you:
- ✅ If database connects successfully
- ❌ What's wrong if it fails

### Step 5: Fix PostgreSQL Issues

**If PostgreSQL is not running:**
```powershell
# Check services
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }

# Start service (replace with actual service name)
Start-Service -Name "postgresql-x64-14"
```

**If PostgreSQL is not installed:**
1. Download: https://www.postgresql.org/download/windows/
2. Install it
3. Remember the password you set!

**If database doesn't exist:**
```powershell
psql -U postgres
CREATE DATABASE lms_db;
\q
```

**If schema not run:**
```powershell
cd database
psql -U postgres -d lms_db -f schema.sql
```

### Step 6: Restart Server

```powershell
cd server
npm run dev
```

Check console for:
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

## Quick Checklist

- [ ] `.env` file created in `server/` directory
- [ ] `DB_PASSWORD` updated with actual PostgreSQL password
- [ ] PostgreSQL service is running
- [ ] Database `lms_db` exists
- [ ] Database schema has been run
- [ ] Server restarted
- [ ] Test connection: `node test-db-connection.js`

## Still Getting 503?

Run the test script:
```powershell
cd server
node test-db-connection.js
```

It will tell you exactly what's wrong!

