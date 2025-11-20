# ✅ Database Moved to server/database

## Migration Complete

✅ Database folder moved from `database/` to `server/database/`  
✅ All script paths updated  
✅ All documentation updated

## New Structure

```
server/
├── database/
│   ├── schema.sql
│   ├── schema_mysql.sql
│   ├── schema_content_library.sql
│   ├── init.sql
│   └── README.md
├── config/
├── routes/
└── ...
```

## Updated Paths

All database references now use `server/database/`:

- **Schema:** `server/database/schema.sql`
- **Init:** `server/database/init.sql`
- **Scripts:** All run from `server/` directory

## Testing

**From project root:**
```powershell
cd server
node test-db-connection.js
```

**From server directory:**
```powershell
# All commands now run from server/
node test-db-connection.js
node create-test-user.js
psql -U postgres -d lms_db -f database\schema.sql
```

## Current Status

✅ Database files: Moved to `server/database/`  
✅ Scripts: Updated to use new paths  
✅ .env file: Exists in `server/`  
⚠️ PostgreSQL: Needs to be installed/started

## Next Steps

1. **Install PostgreSQL** (if not installed)
   - Download: https://www.postgresql.org/download/windows/
   - Install and remember the password

2. **Start PostgreSQL Service**
   ```powershell
   Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" } | Start-Service
   ```

3. **Update .env Password**
   - Edit `server/.env`
   - Update `DB_PASSWORD` with your PostgreSQL password

4. **Create Database**
   ```powershell
   cd server
   psql -U postgres
   CREATE DATABASE lms_db;
   \q
   ```

5. **Run Schema**
   ```powershell
   cd server
   psql -U postgres -d lms_db -f database\schema.sql
   ```

6. **Create Test User**
   ```powershell
   cd server
   node create-test-user.js
   ```

7. **Test Connection**
   ```powershell
   cd server
   node test-db-connection.js
   ```

8. **Start Server & Test Login**
   ```powershell
   cd server
   npm run dev
   ```

Then login at: http://localhost:5173/pages/auth/login.html  
Credentials: test@example.com / test123456

## All Scripts Updated

- ✅ `server/setup-database.ps1`
- ✅ `server/test-db-connection.js`
- ✅ `QUICK_FIX_ALL.ps1`
- ✅ `COMPLETE_SETUP.md`

All paths are now relative to `server/` directory!

