/**
 * Test Email Route
 * Endpoint to test email configuration
 */
import express from 'express';
import EmailService from '../services/EmailService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Test email endpoint (admin only)
router.post('/test-email', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email service is configured
    if (!EmailService.isConfigured()) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'Please set EMAIL_USER and EMAIL_PASSWORD in .env file',
        configured: false,
      });
    }

    // Send test email
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      await EmailService.sendOTPEmail(email, testOTP, 'Test User');
      
      return res.json({
        success: true,
        message: 'Test email sent successfully',
        email,
        testOTP: process.env.NODE_ENV === 'development' ? testOTP : undefined,
        note: process.env.NODE_ENV === 'development' 
          ? 'OTP shown only in development mode'
          : 'Check your email inbox for the OTP code',
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        message: emailError.message,
        errorCode: emailError.code,
        testOTP: process.env.NODE_ENV === 'development' ? testOTP : undefined,
        troubleshooting: {
          'EAUTH': 'Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD',
          'ECONNECTION': 'Cannot connect to email server. Check internet connection.',
          'ETIMEDOUT': 'Connection timeout. Try again later.',
        },
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Check email configuration (public for debugging)
router.get('/email-status', (req, res) => {
  const isConfigured = EmailService.isConfigured();
  const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
  
  return res.json({
    configured: isConfigured,
    emailUser: emailUser ? `${emailUser.substring(0, 3)}***@***` : 'Not set',
    hasEmailUser: !!emailUser,
    hasEmailPassword: !!(process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD),
    nodeEnv: process.env.NODE_ENV,
  });
});

export default router;

