# Firebase Email Verification - Quick Setup

## Installation

```bash
cd server
npm install firebase-admin
```

## Configuration

Add to `server/.env`:

```env
# Required
FIREBASE_PROJECT_ID=your-project-id

# Option 1: Service account file (recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Option 2: Environment variables (alternative)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Frontend URL for verification links
FRONTEND_URL=http://localhost:5173
```

## Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `server/config/firebase-service-account.json`
6. **IMPORTANT:** Add to `.gitignore`:
   ```
   server/config/firebase-service-account.json
   ```

## How It Works

1. **Registration**: System tries Firebase first, falls back to OTP if not configured
2. **Email Sent**: Firebase sends verification email automatically
3. **User Clicks Link**: Redirects to your frontend
4. **Verification**: Frontend calls `/api/firebase-auth/verify-email` with action code

## API Endpoints

### Verify Email (Action Code)
```
POST /api/firebase-auth/verify-email
Body: { "actionCode": "...", "email": "user@example.com" }
```

### Verify Email (ID Token)
```
POST /api/firebase-auth/verify-email-token
Body: { "idToken": "..." }
```

### Resend Verification
```
POST /api/firebase-auth/resend-verification
Body: { "email": "user@example.com" }
```

## Fallback Behavior

If Firebase is **not configured**, the system automatically uses:
- Custom OTP email verification
- No code changes needed
- Seamless fallback

## Testing

1. Register a new user
2. Check email for Firebase verification link
3. Click link or extract `oobCode` from URL
4. Call verification API with action code

---

**See full documentation:** `docs/FIREBASE_EMAIL_VERIFICATION.md`


