# ✅ Database Moved to server/database

## What Changed

✅ Database folder moved from `database/` to `server/database/`  
✅ All script paths updated  
✅ All documentation updated

## New Paths

- **Schema file:** `server/database/schema.sql`
- **Init file:** `server/database/init.sql`
- **Other SQL files:** `server/database/*.sql`

## Testing

Run from project root:

```powershell
cd server
node test-db-connection.js
```

Or use the setup script:

```powershell
.\QUICK_FIX_ALL.ps1
```

## Updated Commands

**Run schema:**
```powershell
cd server
psql -U postgres -d lms_db -f database\schema.sql
```

**Create test user:**
```powershell
cd server
node create-test-user.js
```

**Test connection:**
```powershell
cd server
node test-db-connection.js
```

All paths are now relative to `server/` directory!

