# Database Save Troubleshooting Guide

## Problem: Data Not Being Saved

If your data is not persisting in the database, follow these steps:

---

## 🔍 Quick Diagnosis

### 1. Check Database Connection

```bash
curl http://localhost:5173/api/db/status
```

**Expected Response:**
```json
{
  "connected": true,
  "currentTime": "2024-01-01T12:00:00.000Z",
  "postgresVersion": "PostgreSQL 15.0",
  "database": "lms_db",
  "host": "localhost"
}
```

### 2. Test Database Write

```bash
# Login as admin first, then:
curl -X POST http://localhost:5173/api/db/test-write \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database write test passed",
  "inserted": { "id": 1, "test_data": "test_1234567890" },
  "read": { "id": 1, "test_data": "test_1234567890" }
}
```

### 3. Check Server Logs

When you save data, look for these messages in server console:

**Good:**
```
📝 Creating record in users: { keys: [...], valuesCount: 5 }
💾 INSERT executed in users: 1 row(s) affected
✅ Record created in users: { user_id: 1, ... }
```

**Bad:**
```
❌ Failed to create record in users: ...
❌ Database query error in users: ...
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: Date Objects Not Converted

**Problem:** JavaScript Date objects not converted to PostgreSQL timestamps.

**Solution:** ✅ Fixed! Date objects are now automatically converted to ISO strings.

### Issue 2: Database Connection Issues

**Symptoms:**
- Server logs show: `❌ Database connection failed`
- API returns connection errors

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   services.msc → Check PostgreSQL service
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Check `.env` file in `server/`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lms_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

3. Test connection:
   ```bash
   psql -U postgres -d lms_db -c "SELECT 1;"
   ```

### Issue 3: Transaction Not Committed

**Problem:** Data inserted but not visible (transaction rolled back).

**Solution:** ✅ Fixed! Using `pool.query()` which auto-commits each query.

### Issue 4: Silent Errors

**Problem:** Errors caught but not logged, so data appears to save but doesn't.

**Solution:** ✅ Fixed! Added detailed error logging with PostgreSQL error codes.

### Issue 5: Wrong Database

**Problem:** Saving to wrong database or schema.

**Solution:**
1. Check which database you're connected to:
   ```bash
   curl http://localhost:5173/api/db/status
   ```

2. Verify database name in `.env`:
   ```env
   DB_NAME=lms_db  # Make sure this matches your actual database
   ```

### Issue 6: Permission Issues

**Problem:** Database user doesn't have INSERT/UPDATE permissions.

**Solution:**
```sql
-- Grant permissions (run as postgres superuser)
GRANT ALL PRIVILEGES ON DATABASE lms_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

---

## 🧪 Testing Data Persistence

### Test 1: Create a User

```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

**Check server logs for:**
```
📝 Creating record in users: ...
💾 INSERT executed in users: 1 row(s) affected
✅ Record created in users: { user_id: 1, ... }
```

### Test 2: Verify Data Saved

```bash
# Login with the user you just created
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

If login works, data was saved successfully!

### Test 3: Check Database Directly

```bash
psql -U postgres -d lms_db -c "SELECT * FROM users ORDER BY created_at DESC LIMIT 5;"
```

---

## 📋 Debugging Checklist

- [ ] PostgreSQL is running
- [ ] Database connection successful (check `/api/db/status`)
- [ ] Database write test passes (`/api/db/test-write`)
- [ ] `.env` file has correct database credentials
- [ ] Server logs show successful INSERT/UPDATE operations
- [ ] No errors in server console
- [ ] Database user has proper permissions
- [ ] Data visible when querying database directly

---

## 🔧 Advanced Debugging

### Enable Detailed Logging

The system now logs:
- ✅ All INSERT/UPDATE/DELETE operations
- ✅ Row counts affected
- ✅ Error details with PostgreSQL error codes
- ✅ Query parameters (in development mode)

### Check Server Logs

When saving data, you should see:
```
📝 Creating record in [table_name]: { keys: [...], valuesCount: N }
💾 INSERT executed in [table_name]: 1 row(s) affected
✅ Record created in [table_name]: { ... }
```

If you see errors:
```
❌ Failed to create record in [table_name]: [error message]
   Error code: [PostgreSQL error code]
   Query: [SQL query]
   Params: [query parameters]
```

### Common PostgreSQL Error Codes

- `23505` - Unique violation (duplicate key)
- `23503` - Foreign key violation
- `23502` - Not null violation
- `42P01` - Table does not exist
- `42P02` - Column does not exist
- `08003` - Connection does not exist
- `08006` - Connection failure

---

## 💡 Quick Fixes

### Fix 1: Restart Server

Sometimes a simple restart fixes connection issues:
```bash
# Stop server (Ctrl+C)
cd server
npm run dev
```

### Fix 2: Reconnect Database

Check connection on startup - you should see:
```
✅ Database connected successfully
📊 Database: lms_db
✅ Database write test passed - data can be saved
```

### Fix 3: Check Database Exists

```bash
psql -U postgres -l | grep lms_db
```

If database doesn't exist:
```bash
createdb -U postgres lms_db
```

---

## 🆘 Still Not Working?

1. **Check server logs** - Look for error messages
2. **Test database connection** - Use `/api/db/status`
3. **Test database write** - Use `/api/db/test-write`
4. **Check database directly** - Query with `psql`
5. **Verify permissions** - Database user needs INSERT/UPDATE/DELETE
6. **Check for errors** - Look for PostgreSQL error codes in logs

---

## 📊 Monitoring

The system now provides:
- ✅ Detailed operation logging
- ✅ Row count verification
- ✅ Error code reporting
- ✅ Database connection testing
- ✅ Write operation testing

All database operations are now logged with clear success/failure indicators!

