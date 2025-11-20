# Admin Login Guide

## Admin Account Credentials

- **Email/Username:** `admin`
- **Password:** `admin`

## How to Login

1. **Start the server** (if not already running):
   ```bash
   cd server
   node server.js
   ```

2. **Open the login page** in your browser:
   - Navigate to: `http://localhost:5173/pages/auth/login.html`

3. **Enter credentials**:
   - Email/Username: `admin`
   - Password: `admin`

4. **Click "Sign In"**

5. **You will be redirected** to the Admin Dashboard

## Admin Account Features

- ✅ Bypasses email verification requirement
- ✅ Bypasses admin approval requirement
- ✅ Full admin privileges
- ✅ Can approve/reject users
- ✅ Can manage all system settings

## Troubleshooting

### If login fails:

1. **Check server is running**:
   - Look for server console output
   - Check `http://localhost:5173/api/health`

2. **Verify admin account exists**:
   ```bash
   cd server
   node create-admin-user.js
   ```

3. **Check database connection**:
   - Ensure PostgreSQL is running
   - Check `.env` file has correct database credentials

4. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for any JavaScript errors
   - Check Network tab for API call status

5. **Check server logs**:
   - Look at server console for detailed error messages
   - Check for validation errors or database connection issues

## Security Note

⚠️ **IMPORTANT**: Change the admin password after first login for security!

