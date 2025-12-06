# OTP Login Setup Guide

## Overview

The system now supports **OTP (One-Time Password) login via Gmail**. Users can log in using a 6-digit code sent to their email instead of a password.

## Features

- ✅ OTP-based login (6-digit code)
- ✅ Email delivery via Gmail SMTP
- ✅ OTP expires in 10 minutes
- ✅ One-time use (OTP is invalidated after use)
- ✅ Automatic cleanup of expired OTPs
- ✅ Traditional password login still available

## Setup Instructions

### 1. Gmail App Password Setup

To use Gmail for sending OTP emails, you need to create an App Password:

1. **Enable 2-Step Verification**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "VIAN LMS" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

### 2. Environment Variables

Add these to your `server/.env` file:

```env
# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password

# Or use alternative names
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Important**: Use the **App Password**, not your regular Gmail password!

### 3. Database Setup

The OTP table is automatically created on server start. No manual setup needed.

## API Endpoints

### Request OTP

**POST** `/api/auth/request-otp`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "OTP code has been sent to your email.",
  "expiresIn": 10
}
```

**Note**: In development mode, the OTP code is also returned in the response for testing.

### Login with OTP

**POST** `/api/auth/login-otp`

Request body:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active"
  }
}
```

### Traditional Password Login

**POST** `/api/auth/login`

Still available and works as before.

## Usage Flow

### For Users:

1. **Request OTP**:
   - User enters email on login page
   - Clicks "Send OTP" or "Login with OTP"
   - System sends 6-digit code to email

2. **Enter OTP**:
   - User receives email with OTP code
   - Enters code on login page
   - System validates and logs in user

3. **OTP Expires**:
   - OTP is valid for 10 minutes
   - Can request new OTP if expired

## Security Features

- ✅ OTP expires after 10 minutes
- ✅ OTP can only be used once
- ✅ Previous unused OTPs are invalidated when new one is requested
- ✅ Email not revealed if user doesn't exist
- ✅ Rate limiting recommended (to be implemented)

## Troubleshooting

### Email Not Sending

1. **Check Gmail App Password**:
   - Make sure you're using App Password, not regular password
   - Verify App Password is correct

2. **Check Environment Variables**:
   ```bash
   # Verify in server/.env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

3. **Check Server Logs**:
   - Look for "✅ Email service ready" on startup
   - Check for email send errors

4. **Test Email Service**:
   ```javascript
   // In server console
   const EmailService = require('./services/EmailService.js');
   await EmailService.sendOTPEmail('test@example.com', '123456', 'Test User');
   ```

### OTP Not Working

1. **Check Database**:
   - Verify `otp_codes` table exists
   - Check if OTPs are being created

2. **Check Expiration**:
   - OTP expires in 10 minutes
   - Request new OTP if expired

3. **Check Code Format**:
   - OTP must be exactly 6 digits
   - No spaces or special characters

## Development Mode

In development mode (`NODE_ENV=development`), the OTP code is returned in the API response for easier testing:

```json
{
  "message": "OTP code has been sent to your email.",
  "otp": "123456",
  "note": "OTP shown only in development mode"
}
```

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for OTP requests
2. **Email Service**: Consider using dedicated email service (SendGrid, AWS SES) for production
3. **Security**: Never expose OTP in production responses
4. **Monitoring**: Monitor email delivery rates
5. **Backup**: Keep password login as backup option

## Alternative Email Services

You can use other email services by modifying `EmailService.js`:

- **SendGrid**: Use SendGrid API
- **AWS SES**: Use AWS SDK
- **Mailgun**: Use Mailgun API
- **SMTP**: Configure any SMTP server

## Support

For issues or questions:
- Check server logs for errors
- Verify environment variables
- Test email service configuration
- Review OTP table in database

