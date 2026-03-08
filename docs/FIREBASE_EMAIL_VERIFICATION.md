# Firebase Email Verification Setup Guide

This guide explains how to set up Firebase Authentication for email verification in the LMS system.

## Overview

The system now supports Firebase Authentication for email verification, which provides:
- ✅ Secure email verification links
- ✅ Automatic email sending via Firebase
- ✅ Better deliverability
- ✅ Fallback to custom OTP verification if Firebase is not configured

## Prerequisites

1. **Firebase Project**: Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. **Firebase Admin SDK**: Service account credentials

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enable Authentication:
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password** provider

### 2. Get Service Account Credentials

1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file (keep it secure!)

### 3. Configure Environment Variables

Add these to your `server/.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json

# OR use individual credentials (alternative method)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Frontend URL for verification links
FRONTEND_URL=http://localhost:5173
```

### 4. Install Firebase Admin SDK

```bash
cd server
npm install firebase-admin
```

### 5. Place Service Account File

Place your downloaded service account JSON file in a secure location:

```
server/
  config/
    firebase-service-account.json  (DO NOT commit to git!)
```

Add to `.gitignore`:
```
server/config/firebase-service-account.json
```

## Usage

### Registration Flow

When a user registers, the system will:

1. **Check if Firebase is configured**
   - If yes: Generate Firebase verification link and send email
   - If no: Fall back to custom OTP verification

2. **Send verification email** via Firebase or custom email service

3. **User clicks link** in email

4. **Verify email** using Firebase action code

### API Endpoints

#### 1. Register User (with Firebase verification)

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "email_verified": false
  },
  "verificationLink": "https://..." // Only in development mode
}
```

#### 2. Verify Email (Firebase Action Code)

```http
POST /api/auth/verify-email-firebase
Content-Type: application/json

{
  "actionCode": "firebase-action-code-from-email-link"
}
```

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "message": "Email verified successfully"
}
```

#### 3. Verify Email (Firebase ID Token)

```http
POST /api/auth/verify-email-firebase-token
Content-Type: application/json

{
  "idToken": "firebase-id-token"
}
```

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "message": "Email verified successfully"
}
```

## Implementation Details

### Firebase Service (`server/services/FirebaseService.js`)

Handles Firebase Admin SDK operations:
- Initialize Firebase Admin SDK
- Create users in Firebase Auth
- Generate email verification links
- Verify email tokens
- Manage user accounts

### Firebase Email Service (`server/services/FirebaseEmailService.js`)

Integrates Firebase with the LMS:
- Send verification emails via Firebase
- Fallback to custom OTP if Firebase not configured
- Verify email using Firebase action codes or ID tokens
- Update database after verification

## Fallback Behavior

If Firebase is **not configured**, the system automatically falls back to:
- Custom OTP email verification
- Uses existing `EmailService` and `OTPModel`
- No changes needed to existing code

## Verification Flow

### Option 1: Firebase Email Link (Recommended)

1. User registers → Firebase generates verification link
2. Email sent with link via Firebase
3. User clicks link → Redirects to verification page
4. Frontend extracts `actionCode` from URL
5. Frontend calls `/api/auth/verify-email-firebase` with `actionCode`
6. Backend verifies and updates database

### Option 2: Firebase ID Token

1. User registers → Firebase generates verification link
2. User clicks link → Firebase verifies email
3. Frontend gets Firebase ID token
4. Frontend calls `/api/auth/verify-email-firebase-token` with `idToken`
5. Backend verifies token and updates database

### Option 3: Custom OTP (Fallback)

1. User registers → System generates OTP
2. Email sent with OTP code
3. User enters OTP → Calls `/api/auth/verify-registration`
4. Backend verifies OTP and updates database

## Frontend Integration

### Email Verification Page

Create `client/pages/auth/verify-email-firebase.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Verify Email - VIAN Academy</title>
</head>
<body>
  <div id="verification-status">
    <p>Verifying your email...</p>
  </div>

  <script>
    // Extract action code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const actionCode = urlParams.get('oobCode') || urlParams.get('code');
    const mode = urlParams.get('mode');

    if (actionCode && mode === 'verifyEmail') {
      // Call API to verify
      fetch('/api/auth/verify-email-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionCode })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('verification-status').innerHTML = 
            '<h2>✅ Email Verified!</h2><p>You can now login.</p>';
          setTimeout(() => {
            window.location.href = '/pages/auth/login.html';
          }, 2000);
        } else {
          document.getElementById('verification-status').innerHTML = 
            '<h2>❌ Verification Failed</h2><p>' + data.error + '</p>';
        }
      })
      .catch(error => {
        document.getElementById('verification-status').innerHTML = 
          '<h2>❌ Error</h2><p>' + error.message + '</p>';
      });
    }
  </script>
</body>
</html>
```

## Testing

### Test Firebase Configuration

```bash
cd server
node -e "
import FirebaseService from './services/FirebaseService.js';
console.log('Firebase configured:', FirebaseService.isConfigured());
"
```

### Test Email Verification

1. Register a new user
2. Check email for verification link
3. Click the link
4. Verify email is marked as verified in database

## Troubleshooting

### Firebase Not Initializing

**Error:** `Firebase not configured`

**Solutions:**
1. Check `FIREBASE_PROJECT_ID` is set in `.env`
2. Verify service account file path is correct
3. Check service account JSON file is valid
4. Ensure Firebase Admin SDK is installed: `npm install firebase-admin`

### Email Not Sending

**Error:** `Email service not configured`

**Solutions:**
1. Firebase handles email sending automatically
2. Check Firebase Console > Authentication > Templates
3. Verify email provider is enabled in Firebase
4. Check Firebase project billing (free tier has limits)

### Verification Link Not Working

**Error:** `Invalid or expired action code`

**Solutions:**
1. Action codes expire after 24 hours
2. Generate a new verification link
3. Check `FRONTEND_URL` matches your frontend domain
4. Verify Firebase project settings

## Security Notes

⚠️ **IMPORTANT:**
1. **Never commit** service account JSON files to git
2. Add `firebase-service-account.json` to `.gitignore`
3. Use environment variables for production
4. Rotate service account keys regularly
5. Limit service account permissions (only Auth Admin)

## Environment Variables Summary

```env
# Required
FIREBASE_PROJECT_ID=your-project-id

# Option 1: Service account file path
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Option 2: Individual credentials (alternative)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Optional
FRONTEND_URL=http://localhost:5173
```

## Migration from Custom Verification

The system automatically falls back to custom OTP verification if Firebase is not configured, so:
- ✅ No breaking changes
- ✅ Gradual migration possible
- ✅ Both systems can coexist
- ✅ Easy to switch back if needed

---

**Last Updated:** 2024-01-20  
**Version:** 1.0


