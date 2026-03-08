/**
 * Firebase Service
 * Handles Firebase Authentication for email verification
 */
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

class FirebaseService {
  constructor() {
    this.app = null;
    this.initialized = false;
    // Initialize synchronously - will be async in first method call if needed
    this.initPromise = null;
  }

  /**
   * Initialize Firebase Admin SDK (lazy initialization)
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Check if Firebase is configured
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
      const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!firebaseProjectId) {
        console.warn('⚠️  Firebase not configured. FIREBASE_PROJECT_ID not set in .env');
        console.warn('💡 Email verification will fall back to custom implementation');
        return;
      }

      // Initialize Firebase Admin SDK
      if (serviceAccountPath) {
        // Use service account file (read synchronously for initialization)
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        const serviceAccountPathResolved = path.resolve(__dirname, '..', serviceAccountPath);
        const serviceAccountData = fs.readFileSync(serviceAccountPathResolved, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountData);
        
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseProjectId,
        });
      } else if (firebasePrivateKey && firebaseClientEmail) {
        // Use environment variables
        const privateKey = firebasePrivateKey.replace(/\\n/g, '\n');
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseProjectId,
            clientEmail: firebaseClientEmail,
            privateKey: privateKey,
          }),
          projectId: firebaseProjectId,
        });
      } else {
        console.warn('⚠️  Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL');
        return;
      }

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized');
      console.log(`📧 Firebase Project: ${firebaseProjectId}`);
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error.message);
      console.error('💡 Email verification will fall back to custom implementation');
      this.initialized = false;
    }
  }

  /**
   * Check if Firebase is configured and initialized
   */
  async isConfigured() {
    if (!this.initialized && !this.initPromise) {
      await this.initialize();
    }
    return this.initialized && this.app !== null;
  }

  /**
   * Create a user in Firebase Auth
   */
  async createUser(email, password, displayName = null) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false, // Will be verified via email link
      });

      // Send email verification
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        verificationLink,
      };
    } catch (error) {
      console.error('Firebase create user error:', error);
      throw error;
    }
  }

  /**
   * Generate email verification link
   */
  async generateEmailVerificationLink(email) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/auth/verify-email-success.html`,
        handleCodeInApp: false,
      };

      const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
      return link;
    } catch (error) {
      console.error('Firebase generate verification link error:', error);
      throw error;
    }
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(idToken) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase verify token error:', error);
      throw error;
    }
  }

  /**
   * Verify email by action code (from email link)
   */
  async verifyEmailWithActionCode(actionCode) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      // Apply the action code to verify the email
      await admin.auth().applyActionCode(actionCode);
      
      // Get the email from the action code (we need to check the user)
      // Since applyActionCode doesn't return email, we'll need to get it from the request
      // For now, return success - the email will be extracted in FirebaseEmailService
      return { success: true };
    } catch (error) {
      console.error('Firebase verify action code error:', error);
      throw error;
    }
  }

  /**
   * Create user in Firebase Auth and generate verification link
   * This is the recommended approach - create user first, then verify
   */
  async createUserAndGetVerificationLink(email, password, displayName = null) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      // Generate email verification link
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/auth/verify-email-success.html`,
        handleCodeInApp: false,
      };

      const verificationLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        verificationLink,
      };
    } catch (error) {
      console.error('Firebase create user error:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update user email verification status
   */
  async updateEmailVerification(uid, emailVerified) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      await admin.auth().updateUser(uid, {
        emailVerified,
      });
      return true;
    } catch (error) {
      console.error('Firebase update email verification error:', error);
      throw error;
    }
  }

  /**
   * Delete user from Firebase Auth
   */
  async deleteUser(uid) {
    if (!(await this.isConfigured())) {
      throw new Error('Firebase not configured');
    }

    try {
      await admin.auth().deleteUser(uid);
      return true;
    } catch (error) {
      console.error('Firebase delete user error:', error);
      throw error;
    }
  }
}

export default new FirebaseService();

