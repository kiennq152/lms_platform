/**
 * Test OTP Route
 * Simple endpoint to test OTP without authentication
 */
import express from 'express';
import OTPModel from '../models/OTPModel.js';
import EmailService from '../services/EmailService.js';
import UserModel from '../models/UserModel.js';

const router = express.Router();

// Test OTP request (no auth required for testing)
router.post('/test-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        error: 'Email is required',
        message: 'Please provide an email address',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Check if user exists
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.json({
        success: false,
        error: 'User not found',
        message: 'No user found with this email address. Please register first.',
        email,
      });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    let otpRecord;
    try {
      otpRecord = await OTPModel.createOTP(user.user_id, otpCode, expiresAt);
      console.log('✅ OTP saved to database:', { userId: user.user_id, otpId: otpRecord.otp_id });
    } catch (dbError) {
      console.error('❌ Failed to save OTP to database:', dbError);
      return res.json({
        success: false,
        error: 'Failed to generate OTP',
        message: 'Database error while saving OTP',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
      });
    }

    // Check email service configuration
    const emailConfigured = EmailService.isConfigured();
    
    // Try to send email
    let emailSent = false;
    let emailError = null;

    if (emailConfigured) {
      try {
        const userName = `${user.first_name} ${user.last_name}`;
        await EmailService.sendOTPEmail(email, otpCode, userName);
        emailSent = true;
        console.log(`✅ OTP email sent to ${email}`);
      } catch (emailErr) {
        emailError = emailErr;
        console.error('❌ Failed to send OTP email:', emailErr.message);
        console.error('   Error code:', emailErr.code);
      }
    } else {
      emailError = { code: 'EMAIL_NOT_CONFIGURED', message: 'Email service not configured' };
      console.warn('⚠️  Email service not configured - OTP will be shown in response');
    }

    // Always return OTP in response for testing
    return res.json({
      success: true,
      message: emailSent 
        ? 'OTP code has been sent to your email. Please check your inbox (and spam folder).'
        : 'OTP code generated. Email not configured - OTP shown below for testing.',
      email,
      otp: otpCode,
      expiresIn: 10, // minutes
      emailSent,
      emailConfigured,
      ...(emailError && {
        emailError: emailError.message,
        emailErrorCode: emailError.code,
        troubleshooting: {
          'EMAIL_NOT_CONFIGURED': 'Set EMAIL_USER and EMAIL_PASSWORD in server/.env',
          'EAUTH': 'Check your Gmail App Password (must be 16 characters, no spaces)',
          'ECONNECTION': 'Check internet connection and Gmail SMTP access',
          'ETIMEDOUT': 'Connection timeout - try again later',
        },
      }),
      note: 'This is a test endpoint. OTP is always shown for debugging.',
      instructions: [
        '1. Check your email inbox (and spam/junk folder)',
        '2. If email not received, use the OTP code shown above',
        '3. OTP expires in 10 minutes',
        '4. To configure email, see server/docs/EMAIL_TROUBLESHOOTING.md',
      ],
    });
  } catch (error) {
    console.error('Test OTP error:', error);
    return res.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;

