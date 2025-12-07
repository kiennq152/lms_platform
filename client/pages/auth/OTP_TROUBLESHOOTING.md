# OTP Troubleshooting Guide for Registration

## 🚨 Problem: Cannot Receive OTP During Registration

### Quick Solution: OTP is Always Shown

Even if email doesn't work, **the OTP code is always shown in the registration response**:

1. **After registration**, the OTP verification section appears
2. **Check the blue box** - OTP code is displayed there
3. **Use that code** to verify your email

---

## ✅ How to Get OTP

### Method 1: Check OTP on Screen (Development Mode)

After registration:
1. OTP verification section appears automatically
2. Look for the **blue box** with "OTP Code (Development Mode)"
3. The 6-digit code is shown there
4. Use that code to verify

### Method 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. After registration, you'll see:
   ```
   Registration successful: {...}
   OTP from response: 123456
   Email sent: false
   ```
4. Use the OTP code shown

### Method 3: Check API Response

If you're testing with API directly:
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

Response includes:
```json
{
  "message": "...",
  "otp": "123456",
  "emailSent": false,
  "note": "Email not configured - OTP shown for testing"
}
```

---

## 🔧 Configure Email (For Real Emails)

### Step 1: Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other" → Name: "VIAN LMS"
3. Copy 16-character password (no spaces!)

### Step 3: Update `server/.env`

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 4: Restart Server

```bash
cd server
npm run dev
```

---

## 🧪 Testing Without Email

The system works perfectly without email:

1. **Register** → Fill form and submit
2. **OTP appears** → Check blue box or console
3. **Enter OTP** → Type the 6-digit code
4. **Verify** → Email verified, redirect to login

---

## 📋 Troubleshooting Checklist

- [ ] Check OTP in blue box on screen (development mode)
- [ ] Check browser console for OTP code
- [ ] Try resend OTP button
- [ ] Check spam/junk folder (if email configured)
- [ ] Verify email configuration in `server/.env`
- [ ] Restart server after updating `.env`
- [ ] Check server logs for email errors

---

## 💡 Quick Fix

**For immediate testing:**

1. Register normally
2. OTP code appears in blue box
3. Copy and paste the code
4. Verify email
5. Login

**No email setup needed for testing!**

---

## 🆘 Still Not Working?

1. **Check browser console** - OTP is logged there
2. **Use resend button** - Gets new OTP code
3. **Check server logs** - Look for email errors
4. **Verify `.env` file** - Make sure it's in `server/` directory
5. **Use OTP from response** - Always available in development mode

The OTP system works even without email - the code is always shown for testing! 🎉

