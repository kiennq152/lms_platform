# Registration OTP Verification Guide

## Overview

Registration now uses OTP (One-Time Password) email verification instead of token-based verification. Users must verify their email with an OTP code before they can login.

---

## 🔄 Registration Flow

### Step 1: Register User

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Response:**
```json
{
  "message": "Registration successful! Please check your email for the verification code.",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "email_verified": false,
    "admin_approved": true
  },
  "expiresIn": 15,
  "emailSent": true,
  "otp": "123456",
  "note": "OTP shown only in development mode"
}
```

**What happens:**
1. ✅ User account is created
2. ✅ OTP code is generated (6 digits)
3. ✅ OTP is sent to user's email (if configured)
4. ✅ OTP expires in 15 minutes
5. ✅ User cannot login until email is verified

---

### Step 2: Verify Email with OTP

**Endpoint:** `POST /api/auth/verify-registration`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully! You can now login.",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "email_verified": true,
    "admin_approved": true
  }
}
```

**What happens:**
1. ✅ OTP is verified
2. ✅ Email is marked as verified
3. ✅ User can now login

---

### Step 3: Resend OTP (if needed)

**Endpoint:** `POST /api/auth/resend-registration-otp`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code has been resent to your email.",
  "expiresIn": 15,
  "emailSent": true,
  "otp": "654321",
  "note": "OTP shown only in development mode"
}
```

---

## 📧 Email Configuration

### Setup Gmail (Required for email sending)

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other" → Name: "VIAN LMS"
   - Copy 16-character password

3. **Update `server/.env`:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

4. **Restart server**

---

## 🧪 Testing

### Test Registration

```bash
# 1. Register user
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'

# Response includes OTP (in development mode)
# Use the OTP to verify

# 2. Verify email
curl -X POST http://localhost:5173/api/auth/verify-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# 3. Now user can login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

---

## 🔒 Security Features

- ✅ OTP expires in 15 minutes
- ✅ OTP can only be used once
- ✅ Previous OTPs invalidated when new one requested
- ✅ User cannot login until email verified
- ✅ OTP purpose-specific (registration vs login)

---

## ⚠️ Important Notes

### Without Email Configuration

If email is not configured:
- ✅ Registration still works
- ✅ OTP is shown in API response
- ✅ User can verify with OTP from response
- ⚠️ Not recommended for production

### Development Mode

In development mode (`NODE_ENV=development`):
- ✅ OTP always shown in response
- ✅ Easier testing without email setup
- ⚠️ Don't use in production

### Production Mode

In production:
- ✅ OTP only sent via email
- ✅ OTP not shown in response
- ✅ User must check email for code

---

## 🐛 Troubleshooting

### OTP Not Received

1. **Check spam/junk folder**
2. **Use OTP from response** (development mode)
3. **Resend OTP:** `/api/auth/resend-registration-otp`
4. **Check email configuration:** `/api/email-status`

### OTP Expired

- OTP expires in 15 minutes
- Request new OTP: `/api/auth/resend-registration-otp`

### Invalid OTP

- Check OTP is correct (6 digits)
- Make sure OTP hasn't expired
- Request new OTP if needed

### Email Already Verified

- If user tries to verify again, returns error
- User can proceed to login

---

## 📋 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user (sends OTP) |
| `/api/auth/verify-registration` | POST | Verify email with OTP |
| `/api/auth/resend-registration-otp` | POST | Resend registration OTP |
| `/api/auth/login` | POST | Login (requires verified email) |

---

## 💡 Best Practices

1. **Always verify email** before allowing login
2. **Set appropriate OTP expiry** (15 minutes recommended)
3. **Show clear instructions** to users
4. **Provide resend option** for expired OTPs
5. **Log verification attempts** for security
6. **Handle email failures gracefully** (show OTP in dev mode)

---

## 🔄 Migration from Token-Based

If you were using token-based verification:

**Old Flow:**
1. Register → Get token
2. Click link with token → Verify

**New Flow:**
1. Register → Get OTP code
2. Enter OTP code → Verify

**Benefits:**
- ✅ More secure (OTP expires quickly)
- ✅ Better UX (no link clicking)
- ✅ Works on mobile apps
- ✅ Consistent with login OTP

---

## 📚 Related Documentation

- **Email Setup:** `server/docs/EMAIL_TROUBLESHOOTING.md`
- **OTP Setup:** `server/docs/OTP_SETUP.md`
- **Quick Fix:** `server/docs/QUICK_OTP_FIX.md`

---

**Registration with OTP verification is now active!** 🎉

