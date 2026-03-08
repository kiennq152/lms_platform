# Quick OTP Email Fix Guide

## 🚨 Problem: Cannot Receive OTP Email

### Quick Test

Test if OTP is being generated (even without email):

```bash
curl -X POST http://localhost:5173/api/test-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**This will show:**
- ✅ OTP code (always shown for testing)
- ✅ Whether email was sent
- ✅ Email configuration status
- ✅ Error details if email failed

---

## ✅ Solution 1: Use OTP from Response (Quick Fix)

Even if email doesn't work, **OTP is always shown in the API response**:

1. **Request OTP:**
   ```bash
   curl -X POST http://localhost:5173/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   ```

2. **Response includes OTP:**
   ```json
   {
     "message": "...",
     "otp": "123456",
     "expiresIn": 10
   }
   ```

3. **Use the OTP code to login!**

---

## ✅ Solution 2: Configure Gmail (For Real Emails)

### Step 1: Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Click **"2-Step Verification"**
3. Follow the setup process

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **"Mail"**
3. Select **"Other (Custom name)"**
4. Enter: **"VIAN LMS"**
5. Click **"Generate"**
6. **Copy the 16-character password** (no spaces!)

### Step 3: Update `.env` File

Create/update `server/.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important:**
- ✅ No spaces in password
- ✅ Use the 16-character App Password (not your regular password)
- ✅ Email must match your Gmail account

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C)
cd server
npm run dev
```

### Step 5: Verify

Check server logs for:
```
✅ Email service ready
📧 Sending emails from: your-email@gmail.com
```

---

## 🔍 Troubleshooting

### Check Email Configuration Status

```bash
curl http://localhost:5173/api/email-status
```

**If `configured: false`:**
- Check `.env` file exists in `server/` directory
- Check `EMAIL_USER` and `EMAIL_PASSWORD` are set
- Restart server after updating `.env`

### Test Email Sending

```bash
# Login as admin first, then:
curl -X POST http://localhost:5173/api/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Common Errors

**Error: `EMAIL_NOT_CONFIGURED`**
- Solution: Set `EMAIL_USER` and `EMAIL_PASSWORD` in `server/.env`

**Error: `EAUTH` (Authentication failed)**
- Solution: Regenerate App Password (must be 16 characters, no spaces)

**Error: `ECONNECTION` (Connection failed)**
- Solution: Check internet connection and firewall

**Email sent but not received:**
- ✅ Check **Spam/Junk** folder
- ✅ Check **Promotions** tab (Gmail)
- ✅ Search for "VIAN Academy" or "OTP"
- ✅ Wait a few minutes (sometimes delayed)

---

## 📋 Quick Checklist

- [ ] Test OTP endpoint: `/api/test-otp`
- [ ] Check OTP in response (works even without email)
- [ ] Enable 2-Step Verification on Google Account
- [ ] Generate App Password (16 characters)
- [ ] Update `server/.env` with credentials
- [ ] Restart server
- [ ] Check server logs for "Email service ready"
- [ ] Check spam folder if email sent
- [ ] Use OTP from response if email not received

---

## 💡 For Now (Without Email Setup)

**The system works without email!**

1. Request OTP via API or frontend
2. Check the response - OTP code is included
3. Use that OTP to login
4. Configure email later for production

**Example:**
```bash
# Request OTP
curl -X POST http://localhost:5173/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Response:
{
  "message": "...",
  "otp": "123456",  ← Use this code!
  "expiresIn": 10
}

# Login with OTP
curl -X POST http://localhost:5173/api/auth/login-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

---

## 🆘 Still Not Working?

1. **Use test endpoint:** `/api/test-otp` - Shows detailed diagnostics
2. **Check server logs** - Look for email errors
3. **Verify `.env` file** - Make sure it's in `server/` directory
4. **Test with different email** - Try another email address
5. **Check Gmail account** - Look for security alerts
6. **Use OTP from response** - Works even without email!

The OTP system works even without email configuration - the code is always shown in the response for testing! 🎉

