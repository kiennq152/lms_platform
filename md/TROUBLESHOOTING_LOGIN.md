# Troubleshooting Login API Issues

## Common Issues and Solutions

### 1. "Cannot connect to server" Error

**Problem:** The client cannot reach the API server.

**Solutions:**
- Make sure the server is running:
  ```bash
  cd server
  npm run dev
  ```
- Check if the server is listening on the correct port (default: 5173)
- Verify the API_BASE_URL in `client/js/api.js` is correct
- Check browser console for CORS errors

### 2. "Invalid credentials" Error

**Problem:** Email or password is incorrect, or user doesn't exist.

**Solutions:**
- Verify the user exists in the database
- Check if password was hashed correctly during registration
- Ensure email is verified (check `email_verified` field)
- For instructors, ensure `admin_approved` is true

### 3. Database Connection Issues

**Problem:** Server cannot connect to PostgreSQL database.

**Solutions:**
- Check `.env` file in `server/` directory:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=lms_db
  DB_USER=postgres
  DB_PASSWORD=postgres
  ```
- Ensure PostgreSQL is running
- Verify database exists: `psql -U postgres -l`
- Check database connection in server logs

### 4. Email Verification Required

**Problem:** User tries to login but email is not verified.

**Solution:**
- User must verify email first using the verification link
- Or manually update in database:
  ```sql
  UPDATE users SET email_verified = TRUE WHERE email = 'user@example.com';
  ```

### 5. Instructor Approval Required

**Problem:** Instructor cannot login because account is not approved.

**Solution:**
- Admin must approve the instructor account
- Or manually update in database:
  ```sql
  UPDATE users SET admin_approved = TRUE WHERE email = 'instructor@example.com';
  ```

## Testing the Login API

### Using curl:
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using browser console:
```javascript
// Test API connection
fetch('http://localhost:5173/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Debugging Steps

1. **Check Server Logs:**
   - Look for errors in the terminal where server is running
   - Check for database connection errors
   - Verify API routes are registered

2. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Check Network tab for failed requests
   - Check Console tab for JavaScript errors
   - Verify API calls are being made

3. **Verify Database:**
   - Check if users table exists
   - Verify user data is correct
   - Check password_hash format (should be bcrypt hash)

4. **Test API Endpoints:**
   - Health check: `GET http://localhost:5173/health`
   - Login: `POST http://localhost:5173/api/auth/login`

## Quick Fixes

### Reset a user's password (if needed):
```sql
-- Hash a new password (use bcrypt in Node.js)
-- Then update:
UPDATE users SET password_hash = '$2a$10$hashedpassword' WHERE email = 'user@example.com';
```

### Create a test user directly in database:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, admin_approved)
VALUES (
  'test@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: 'password123'
  'Test',
  'User',
  'student',
  TRUE,
  TRUE
);
```

## Error Messages Reference

- **"Invalid credentials"** - Wrong email/password or user doesn't exist
- **"Please verify your email first"** - Email verification required
- **"Your instructor account is pending admin approval"** - Instructor needs admin approval
- **"Cannot connect to server"** - Server is not running or network issue
- **"Validation error"** - Invalid input format (email format, etc.)

