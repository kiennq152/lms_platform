# Account Login Fix - Why Previous Accounts Don't Work

## Problem

Previous accounts created before the new account creation scripts were not able to login because they were missing required flags:

1. **Email Verification** (`email_verified = false`)
2. **Admin Approval** (`admin_approved = false`)

The login system requires **both** of these to be `true` for regular users (non-admin accounts) to successfully login.

## Why This Happens

When accounts are created through the registration API (`/api/auth/register`), they are created with:
- `email_verified = false` (requires email verification)
- `admin_approved = false` (requires admin approval)

However, accounts created directly in the database or through older scripts might not have these flags set correctly.

## Solution

A script has been created to fix all existing accounts:

```bash
cd server
npm run fix-accounts
```

Or directly:
```bash
node fix-existing-accounts.js
```

### What the Script Does

1. Finds all accounts (except admin/guest special accounts)
2. Checks if they need fixing (missing `email_verified` or `admin_approved`)
3. Updates them to:
   - `email_verified = true`
   - `admin_approved = true`
   - `status = 'active'`

### Filter Options

You can also fix specific accounts:

```bash
# Fix only students
node fix-existing-accounts.js --role=student

# Fix only instructors
node fix-existing-accounts.js --role=instructor

# Fix specific user by email
node fix-existing-accounts.js --email=user@example.com
```

## Login Requirements

For an account to successfully login, it must have:

| Requirement | Admin | Instructor | Student |
|-------------|-------|------------|---------|
| **Email Verified** | ✅ Bypassed | ✅ Required | ✅ Required |
| **Admin Approved** | ✅ Bypassed | ✅ Required | ✅ Required |
| **Status = Active** | ✅ Required | ✅ Required | ✅ Required |

## Accounts Fixed

The script has already fixed **7 accounts**:
- `admin@vianacademy.com` (admin)
- `test-instructor@test.com` (instructor)
- `test-instructor-api@test.com` (instructor)
- `kevinnguyen90kr@gmail.com` (student)
- `fantasy152k@gmail.com` (student)
- `viansolutionskr@gmail.com` (student)
- `teacher@example.com` (instructor)

## Testing

After running the fix script, test login with any of the fixed accounts:

```bash
# Test via API
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Or use the login page at: `http://localhost:5173/pages/auth/login.html`

## Prevention

To prevent this issue in the future:

1. **Use the account creation scripts:**
   ```bash
   npm run create-admin
   npm run create-instructor
   npm run create-student
   ```

2. **These scripts automatically set:**
   - `email_verified = true`
   - `admin_approved = true` (for students and auto-approved instructors)
   - `status = 'active'`

3. **For new registrations via API:**
   - Users must verify their email first
   - Then an admin must approve the account
   - Or use the fix script to approve them

## Troubleshooting

### Account Still Can't Login?

1. **Check account status:**
   ```sql
   SELECT email, role, email_verified, admin_approved, status 
   FROM users 
   WHERE email = 'user@example.com';
   ```

2. **Run the fix script again:**
   ```bash
   npm run fix-accounts
   ```

3. **Check server logs** for specific error messages:
   - "Please verify your email first" → `email_verified = false`
   - "pending admin approval" → `admin_approved = false`
   - "account is inactive" → `status != 'active'`

4. **Verify password is correct:**
   - The script doesn't change passwords
   - If password is wrong, reset it or create a new account

## Related Documentation

- **Account Setup:** `docs/USER_ACCOUNT_SETUP.md`
- **Admin Setup:** `docs/ADMIN_SETUP.md`
- **API Documentation:** `docs/POSTMAN_API_LIST.md`

---

**Last Updated:** 2024-01-20  
**Version:** 1.0


