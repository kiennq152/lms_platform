# Fix Password Authentication Error

## Current Error

```
password authentication failed for user "postgres"
```

## Cause

The server is using an old password from `.env` file that doesn't match PostgreSQL.

## Solution

### Step 1: Verify PostgreSQL Password

The password you told me is: **1234**

### Step 2: Update .env File

I've updated `server/.env` with password `1234`.

**File location:** `server/.env`

**Content:**
```env
DB_PASSWORD=1234
```

### Step 3: Restart Server

**⚠️ CRITICAL:** The server MUST be restarted to load the new password!

**Stop current server:**
- Press `Ctrl+C` in the server console

**Start server again:**
```powershell
cd server
npm run dev
```

### Step 4: Verify Connection

After restarting, test the connection:

```powershell
cd server
node test-db-connection.js
```

Should show: `✅ SUCCESS! Database connected successfully!`

### Step 5: Test Login

```powershell
cd server
node test-login-detailed.js
```

Should show: `✅ LOGIN SUCCESSFUL!`

## If Password is Different

If PostgreSQL password is NOT `1234`, update `.env`:

1. Open `server/.env`
2. Change `DB_PASSWORD=1234` to your actual password
3. Restart server
4. Test again

## Quick Fix Script

```powershell
# Update password in .env
cd server
$content = Get-Content ".env" -Raw
$content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=1234"
$content | Out-File -FilePath ".env" -Encoding utf8

# Restart server (manually)
# Press Ctrl+C, then: npm run dev
```

## Summary

**Issue:** Server using wrong password  
**Fix:** Update `.env` and restart server  
**Password:** 1234 (or your actual PostgreSQL password)

After restart, login should work!

