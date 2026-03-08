/**
 * Firebase Authentication Routes
 * Handles Firebase email verification endpoints
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import FirebaseEmailService from '../services/FirebaseEmailService.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Verify email using Firebase action code
 * POST /api/firebase-auth/verify-email
 */
router.post('/verify-email', [
  body('actionCode').notEmpty().withMessage('Action code is required'),
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { actionCode, email } = req.body;

    const result = await FirebaseEmailService.verifyEmailWithActionCode(actionCode, email);

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: result.email,
      user_id: result.user_id,
    });
  } catch (error) {
    console.error('Firebase email verification error:', error);
    
    if (error.code === 'auth/invalid-action-code') {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }
    
    if (error.code === 'auth/expired-action-code') {
      return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
    }

    res.status(500).json({
      error: 'Failed to verify email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Verify email using Firebase ID token
 * POST /api/firebase-auth/verify-email-token
 */
router.post('/verify-email-token', [
  body('idToken').notEmpty().withMessage('ID token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { idToken } = req.body;

    const result = await FirebaseEmailService.verifyEmailWithIdToken(idToken);

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: result.email,
    });
  } catch (error) {
    console.error('Firebase ID token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    res.status(500).json({
      error: 'Failed to verify email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Resend verification email using Firebase
 * POST /api/firebase-auth/resend-verification
 */
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user in database
    const userResult = await pool.query(
      'SELECT user_id, email, first_name, last_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Send Firebase verification email
    const result = await FirebaseEmailService.sendVerificationEmail(
      user.email,
      user.first_name,
      user.last_name
    );

    res.json({
      success: true,
      message: 'Verification email sent',
      method: result.method,
      verificationLink: result.verificationLink, // Only in development
    });
  } catch (error) {
    console.error('Resend Firebase verification error:', error);
    res.status(500).json({
      error: 'Failed to send verification email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

