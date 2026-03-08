# Email Troubleshooting Guide

## Problem: Cannot Receive OTP Emails

If you're not receiving OTP emails, follow these troubleshooting steps:

---

## 🔍 Quick Diagnosis

### 1. Check Email Service Status

**Via API:**
```bash
curl http://localhost:5173/api/email-status
```

**Expected Response:**
```json
{
  "configured": true,
  "emailUser": "you***@***",
  "hasEmailUser": true,
  "hasEmailPassword": true,
  "nodeEnv": "development"
}
```

### 2. Check Server Logs

When you request OTP, check server console for:
- ✅ `Email service ready` - Service is configured
- ✅ `Email sent successfully` - Email was sent
- ❌ `Email service configuration error` - Configuration issue
- ❌ `Failed to send OTP email` - Sending failed

---

## 🛠️ Common Issues & Solutions

### Issue 1: Email Service Not Configured

**Symptoms:**
- Server logs show: `⚠️ Email service not configured`
- API returns OTP in response (development mode)
- No email sent

**Solution:**
1. Create/update `server/.env` file:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

2. Restart server after updating `.env`

### Issue 2: Wrong App Password

**Symptoms:**
- Error: `EAUTH` or "Authentication failed"
- Server logs show authentication error

**Solution:**
1. **Generate New App Password:**
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "VIAN LMS"
   - Copy the 16-character password (no spaces)

2. **Update `.env`:**
   ```env
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # ❌ Wrong (has spaces)
   EMAIL_PASSWORD=abcdefghijklmnop     # ✅ Correct (no spaces)
   ```

3. **Restart server**

### Issue 3: 2-Step Verification Not Enabled

**Symptoms:**
- Cannot generate App Password
- Error when trying to send email

**Solution:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Then generate App Password (see Issue 2)

### Issue 4: Email in Spam/Junk Folder

**Symptoms:**
- Email service shows "sent successfully"
- But email not in inbox

**Solution:**
1. Check **Spam/Junk** folder
2. Check **Promotions** tab (Gmail)
3. Search for "VIAN Academy" or "OTP"
4. Mark as "Not Spam" if found

### Issue 5: Connection Timeout

**Symptoms:**
- Error: `ETIMEDOUT` or `ECONNECTION`
- Server cannot connect to Gmail

**Solution:**
1. Check internet connection
2. Check firewall settings
3. Try again after a few minutes
4. Verify Gmail SMTP is accessible

---

## 🧪 Testing Email Configuration

### Method 1: Test Email Endpoint (Admin Only)

```bash
# Login as admin first to get token
TOKEN="your-admin-token"

# Test email sending
curl -X POST http://localhost:5173/api/test-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Method 2: Check Email Status

```bash
curl http://localhost:5173/api/email-status
```

### Method 3: Request OTP and Check Response

```bash
curl -X POST http://localhost:5173/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

**In development mode**, response includes OTP:
```json
{
  "message": "OTP code has been sent...",
  "otp": "123456",
  "note": "OTP shown only in development mode"
}
```

---

## 📋 Step-by-Step Setup

### Complete Gmail Setup:

1. **Enable 2-Step Verification**
   ```
   https://myaccount.google.com/security
   → Enable 2-Step Verification
   ```

2. **Generate App Password**
   ```
   https://myaccount.google.com/apppasswords
   → Select "Mail"
   → Select "Other (Custom name)"
   → Enter "VIAN LMS"
   → Generate
   → Copy 16-character password
   ```

3. **Update `.env` File**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

4. **Restart Server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

5. **Verify Configuration**
   - Check server logs for: `✅ Email service ready`
   - Check: `curl http://localhost:5173/api/email-status`

---

## 🔧 Development Mode (No Email Setup)

If you don't want to configure email right now:

1. **OTP will be shown in:**
   - API response (development mode)
   - Browser console
   - Server logs

2. **Request OTP:**
   ```bash
   curl -X POST http://localhost:5173/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Response includes OTP:**
   ```json
   {
     "message": "...",
     "otp": "123456",
     "note": "OTP shown only in development mode"
   }
   ```

---

## 🐛 Debugging Steps

### 1. Check Environment Variables

```bash
# In server directory
cat .env | grep EMAIL
```

Should show:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 2. Check Server Startup Logs

Look for:
- ✅ `Email service ready` - Good
- ❌ `Email service configuration error` - Bad
- ⚠️ `Email service not configured` - Not set up

### 3. Test Email Manually

```javascript
// In server console or test script
import EmailService from './services/EmailService.js';

try {
  await EmailService.sendOTPEmail('test@example.com', '123456', 'Test');
  console.log('✅ Email sent');
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### 4. Check Gmail Settings

- ✅ 2-Step Verification enabled
- ✅ App Password generated
- ✅ App Password copied correctly (no spaces)

---

## 📧 Alternative Email Services

If Gmail doesn't work, you can use other services by modifying `EmailService.js`:

### SendGrid
```javascript
this.transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

### AWS SES
```javascript
this.transporter = nodemailer.createTransport({
  SES: { ses, aws },
  sendingRate: 14,
});
```

### SMTP (Generic)
```javascript
this.transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

---

## ✅ Verification Checklist

- [ ] `.env` file exists in `server/` directory
- [ ] `EMAIL_USER` is set to your Gmail address
- [ ] `EMAIL_PASSWORD` is set to 16-character App Password (no spaces)
- [ ] 2-Step Verification is enabled on Google Account
- [ ] Server restarted after updating `.env`
- [ ] Server logs show: `✅ Email service ready`
- [ ] `/api/email-status` shows `configured: true`
- [ ] Test email endpoint works
- [ ] Checked spam/junk folder

---

## 🆘 Still Not Working?

1. **Check server logs** for detailed error messages
2. **Verify App Password** is correct (regenerate if needed)
3. **Test with different email** address
4. **Check Gmail account** for security alerts
5. **Try test email endpoint** to isolate the issue
6. **Use development mode** to get OTP in response

---

## 💡 Quick Fix for Testing

If you just need to test OTP login without email:

1. **Request OTP** (email service not needed)
2. **Check API response** - OTP is included in development mode
3. **Use OTP from response** to login
4. **Configure email later** for production

The system works even without email configured - OTP is shown in development mode!

