/**
 * Firebase Email Verification Service
 * Integrates Firebase Auth email verification with the LMS system
 */
import FirebaseService from './FirebaseService.js';
import EmailService from './EmailService.js';
import pool from '../config/database.js';

export class FirebaseEmailService {
  /**
   * Send email verification using Firebase
   * Note: Firebase requires creating user in Firebase Auth first
   * For now, we'll use generateEmailVerificationLink which works for existing Firebase users
   * If user doesn't exist in Firebase, we'll fallback to OTP
   */
  async sendVerificationEmail(email, firstName, lastName) {
    try {
      // Check if Firebase is configured
      if (!(await FirebaseService.isConfigured())) {
        console.log('⚠️  Firebase not configured, falling back to custom email verification');
        return this.fallbackToCustomVerification(email, firstName, lastName);
      }

      try {
        // Check if user exists in Firebase Auth
        const firebaseUser = await FirebaseService.getUserByEmail(email);
        
        if (firebaseUser) {
          // User exists in Firebase - generate verification link
          const verificationLink = await FirebaseService.generateEmailVerificationLink(email);
          
          // Send email with Firebase verification link
          const userName = `${firstName} ${lastName}`;
          await this.sendFirebaseVerificationEmail(email, verificationLink, userName);

          return {
            success: true,
            method: 'firebase',
            verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined,
          };
        } else {
          // User doesn't exist in Firebase - fallback to OTP
          console.log('⚠️  User not found in Firebase Auth, falling back to OTP');
          return this.fallbackToCustomVerification(email, firstName, lastName);
        }
      } catch (firebaseError) {
        console.error('Firebase user check error:', firebaseError);
        // Fallback to custom verification
        return this.fallbackToCustomVerification(email, firstName, lastName);
      }
    } catch (error) {
      console.error('Firebase email verification error:', error);
      // Fallback to custom verification
      return this.fallbackToCustomVerification(email, firstName, lastName);
    }
  }

  /**
   * Send Firebase verification email
   */
  async sendFirebaseVerificationEmail(email, verificationLink, userName) {
    const subject = 'Verify Your Email - VIAN Academy LMS';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #1E3A8A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 VIAN Academy LMS</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1E3A8A;">${verificationLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 24 hours</li>
                <li>Never share this link with anyone</li>
                <li>If you didn't register, please ignore this email</li>
              </ul>
            </div>
            <p>After verifying your email, you will be able to login to your account.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} VIAN Academy LMS. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await EmailService.sendEmail(email, subject, html);
  }

  /**
   * Fallback to custom email verification (OTP)
   */
  async fallbackToCustomVerification(email, firstName, lastName) {
    console.log('📧 Using custom email verification (OTP)');
    
    // Import OTP model
    const OTPModel = (await import('../models/OTPModel.js')).default;
    
    // Generate OTP
    const otpRecord = await OTPModel.createOTP(email, 'registration', 15);
    
    // Send OTP email
    const userName = `${firstName} ${lastName}`;
    await EmailService.sendOTPEmail(email, otpRecord.code, userName, 'registration');
    
    return {
      success: true,
      method: 'otp',
      otp: process.env.NODE_ENV === 'development' ? otpRecord.code : undefined,
    };
  }

  /**
   * Verify email using Firebase action code
   */
  async verifyEmailWithActionCode(actionCode, email = null) {
    try {
      if (!(await FirebaseService.isConfigured())) {
        throw new Error('Firebase not configured');
      }

      // Email is required for verification
      if (!email) {
        throw new Error('Email is required for Firebase email verification');
      }
      
      const userEmail = email;

      // Apply the action code to verify the email
      await FirebaseService.verifyEmailWithActionCode(actionCode);
      
      // Update user in database
      const result = await pool.query(
        `UPDATE users 
         SET email_verified = TRUE, 
             email_verified_at = CURRENT_TIMESTAMP,
             email_verification_token = NULL
         WHERE email = $1
         RETURNING user_id, email`,
        [userEmail]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return {
        success: true,
        email: result.rows[0].email,
        user_id: result.rows[0].user_id,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('Firebase email verification error:', error);
      throw error;
    }
  }

  /**
   * Verify email using Firebase ID token
   */
  async verifyEmailWithIdToken(idToken) {
    try {
      if (!(await FirebaseService.isConfigured())) {
        throw new Error('Firebase not configured');
      }

      // Verify the ID token
      const decodedToken = await FirebaseService.verifyEmailToken(idToken);
      
      if (!decodedToken.email_verified) {
        throw new Error('Email not verified in Firebase');
      }

      // Update user in database
      await pool.query(
        `UPDATE users 
         SET email_verified = TRUE, 
             email_verified_at = CURRENT_TIMESTAMP,
             email_verification_token = NULL
         WHERE email = $1`,
        [decodedToken.email]
      );

      return {
        success: true,
        email: decodedToken.email,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('Firebase ID token verification error:', error);
      throw error;
    }
  }
}

export default new FirebaseEmailService();

