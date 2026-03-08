import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['student', 'instructor']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, phone, bio } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    // Create user - ALL users require admin approval
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, bio, email_verification_token, admin_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING user_id, email, first_name, last_name, role, status, email_verified, admin_approved`,
      [email, passwordHash, firstName, lastName, role, phone || null, bio || null, verificationToken, false]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'User registered successfully. Please verify your email. After verification, your account will be reviewed by an administrator before you can log in.',
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        email_verified: user.email_verified,
        admin_approved: user.admin_approved
      },
      verificationToken
    });
  } catch (error) {
    console.error('Register error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ error: 'Database connection failed. Please check database configuration.' });
    }
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
console.log('🔧 Registering POST /login route');
router.post('/login', async (req, res) => {
  console.log('🔐 Login endpoint hit!');
  console.log('Request body:', { ...req.body, password: '***' });
  console.log('Request headers:', req.headers);
  
  try {
    // Manual validation to allow admin/guest
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Validate email format (allow admin/guest) and normalize
    const normalizedEmail = String(email).toLowerCase().trim();
    if (normalizedEmail !== 'admin' && normalizedEmail !== 'guest') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format. Use a valid email or "admin"/"guest"' });
      }
    }
    
    console.log('✅ Login attempt for email:', normalizedEmail);

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('✅ User found:', { 
      user_id: user.user_id, 
      email: user.email, 
      role: user.role,
      email_verified: user.email_verified,
      admin_approved: user.admin_approved
    });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('✅ Password verified for user:', normalizedEmail);

    // Admin and guest accounts bypass email verification and approval checks
    const isSpecialAccount = normalizedEmail === 'admin' || normalizedEmail === 'guest';
    
    if (!isSpecialAccount) {
      // Check if email is verified (for regular users only)
      if (!user.email_verified) {
        console.log('Email not verified for user:', normalizedEmail);
        return res.status(403).json({ error: 'Please verify your email first' });
      }

      // Check if account is approved by admin (ALL regular users require approval)
      if (!user.admin_approved) {
        console.log('Account not approved:', normalizedEmail, 'Role:', user.role);
        return res.status(403).json({ 
          error: 'Your account is pending admin approval. Please wait for an administrator to approve your account before logging in.' 
        });
      }
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('Login successful for user:', normalizedEmail);
    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
        admin_approved: user.admin_approved
      }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ error: 'Database connection failed. Please check database configuration.' });
    }
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Verify Email
router.post('/verify-email', [
  body('token').notEmpty(),
], async (req, res) => {
  try {
    const { token } = req.body;

    // Find user by token
    const result = await pool.query(
      'SELECT user_id, email FROM users WHERE email_verification_token = $1 AND email_verified = FALSE',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = result.rows[0];

    // Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update user
    await pool.query(
      'UPDATE users SET email_verified = TRUE, email_verified_at = CURRENT_TIMESTAMP, email_verification_token = NULL WHERE user_id = $1',
      [user.user_id]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend Verification Email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT user_id, email, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    // Update user with new token
    await pool.query(
      'UPDATE users SET email_verification_token = $1 WHERE user_id = $2',
      [verificationToken, user.user_id]
    );

    res.json({
      message: 'Verification email sent',
      verificationToken
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
    
    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name, role, status, avatar_url, email_verified, admin_approved FROM users WHERE user_id = $1',
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

console.log('✅ Auth routes module loaded');
console.log('Available routes:', router.stack.map(layer => {
  if (layer.route) {
    return `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`;
  }
  return 'Router middleware';
}));

export default router;

