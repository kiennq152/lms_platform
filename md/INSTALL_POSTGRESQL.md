# 🚨 INSTALL POSTGRESQL - Required to Fix 503 Error

## Current Problem
**PostgreSQL is NOT installed** on your system, which is why you're getting the 503 error.

## Solution: Install PostgreSQL

### Step 1: Download PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Choose the latest version (e.g., PostgreSQL 16)
4. Download the Windows x86-64 installer

**Direct link:** https://www.postgresql.org/download/windows/

### Step 2: Install PostgreSQL

1. **Run the installer**
2. **Choose installation directory** (default is fine)
3. **Select components:**
   - ✅ PostgreSQL Server (required)
   - ✅ pgAdmin 4 (optional, but helpful)
   - ✅ Command Line Tools (recommended)
   - ✅ Stack Builder (optional)

4. **Data Directory:** Keep default (usually `C:\Program Files\PostgreSQL\16\data`)

5. **Password:** 
   - ⚠️ **SET A PASSWORD** for the `postgres` superuser
   - ⚠️ **REMEMBER THIS PASSWORD!** You'll need it for `.env` file
   - Example: `postgres123` (but use something secure!)

6. **Port:** Keep default `5432` (this matches your `.env` file)

7. **Advanced Options:** Keep defaults

8. **Pre Installation Summary:** Click Next

9. **Ready to Install:** Click Next

10. **Installing:** Wait for installation to complete

11. **Completing:** 
    - ✅ Uncheck "Launch Stack Builder" (unless you want it)
    - Click Finish

### Step 3: Verify Installation

**Check service:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
```

Should show PostgreSQL service with Status: Running

**Check installation:**
```powershell
Get-ChildItem "C:\Program Files\PostgreSQL" -Directory
```

Should show PostgreSQL folder (e.g., `16` or `15`)

**Test connection:**
```powershell
# Find psql.exe
$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object -First 1
& $psql.FullName --version
```

### Step 4: Update `.env` File

**Open:** `server/.env`

**Update this line:**
```env
DB_PASSWORD=postgres123  ← Change to your PostgreSQL password!
```

**Save the file**

### Step 5: Create Database

**Option A: Using psql (Command Line)**

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

**Option B: Using pgAdmin (GUI)**

1. Open pgAdmin 4 (from Start Menu)
2. Connect to PostgreSQL server (password you set during installation)
3. Right-click "Databases" → Create → Database
4. Name: `lms_db`
5. Click Save

### Step 6: Run Database Schema

```powershell
cd database

# Find psql.exe
$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object -First 1

# Run schema
& $psql.FullName -U postgres -d lms_db -f schema.sql
```

**If it asks for password:** Enter the password you set during installation

### Step 7: Test Database Connection

```powershell
cd server
node test-db-connection.js
```

**Expected output:**
```
✅ SUCCESS! Database connected successfully!
📊 Database Info:
   PostgreSQL Version: PostgreSQL 16.x
   Current Database: lms_db
   Current User: postgres
✅ Users table exists!
```

### Step 8: Restart Server

```powershell
cd server
npm run dev
```

**Check console for:**
- ✅ `Database connected successfully`
- ✅ `Database: lms_db`

### Step 9: Test Login

1. Go to login page
2. Try logging in
3. Should work! ✅

## Quick Installation Checklist

- [ ] Download PostgreSQL installer
- [ ] Install PostgreSQL (remember password!)
- [ ] Update `DB_PASSWORD` in `server/.env`
- [ ] Create database `lms_db`
- [ ] Run database schema
- [ ] Test connection: `node test-db-connection.js`
- [ ] Restart server
- [ ] Test login

## Alternative: Use Docker (Advanced)

If you prefer Docker:

```powershell
docker run --name postgres-lms `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=lms_db `
  -p 5432:5432 `
  -d postgres:16
```

Then update `.env`:
```env
DB_PASSWORD=postgres123
```

## Troubleshooting

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL to PATH:
1. Find PostgreSQL bin folder: `C:\Program Files\PostgreSQL\16\bin`
2. Add to System PATH environment variable
3. Restart PowerShell

### Issue: "Password authentication failed"
**Solution:** 
- Check password in `server/.env` matches PostgreSQL password
- Try connecting manually: `psql -U postgres`

### Issue: "Database does not exist"
**Solution:** Create it: `CREATE DATABASE lms_db;`

### Issue: "Port 5432 already in use"
**Solution:** 
- Another PostgreSQL instance is running
- Stop it or change port in `.env`

## Summary

**The 503 error is because PostgreSQL is not installed.**

**After installing PostgreSQL:**
1. ✅ Update `.env` with PostgreSQL password
2. ✅ Create `lms_db` database
3. ✅ Run schema
4. ✅ Restart server
5. ✅ Login will work!

## Need Help?

After installation, run:
```powershell
cd server
node test-db-connection.js
```

This will tell you if everything is configured correctly!

