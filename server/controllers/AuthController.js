/**
 * Auth Controller
 * Handles authentication-related business logic
 */
import UserModel from '../models/UserModel.js';
import OTPModel from '../models/OTPModel.js';
import EmailService from '../services/EmailService.js';
import jwt from 'jsonwebtoken';

export class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, role, phone, bio } = req.body;

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      // Create user
      const user = await UserModel.createUser({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: role || 'student',
        phone: phone || null,
        bio: bio || null,
        email_verification_token: verificationToken,
        admin_approved: role === 'student', // Students auto-approved
        email_verified: false,
      });

      return res.status(201).json({
        message: 'User registered successfully. Please verify your email.',
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          email_verified: user.email_verified,
          admin_approved: user.admin_approved,
        },
        verificationToken,
      });
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is approved (for instructors)
      if (user.role === 'instructor' && !user.admin_approved) {
        return res.status(403).json({
          error: 'Your account is pending approval. Please wait for administrator approval.',
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({
          error: `Your account is ${user.status}. Please contact administrator.`,
        });
      }

      // Update last login
      await UserModel.updateLastLogin(user.user_id);

      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get current user
   */
  async getMe(req, res) {
    try {
      const userId = req.user.user_id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove sensitive data
      const { password_hash, email_verification_token, ...safeUser } = user;

      return res.json({ user: safeUser });
    } catch (error) {
      console.error('Get me error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Request OTP for login
   */
  async requestOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({
          message: 'If the email exists, an OTP code has been sent.',
        });
      }

      // Check if user is approved and active
      if (user.role === 'instructor' && !user.admin_approved) {
        return res.status(403).json({
          error: 'Your account is pending approval. Please wait for administrator approval.',
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          error: `Your account is ${user.status}. Please contact administrator.`,
        });
      }

      // Generate OTP
      const otpRecord = await OTPModel.createOTP(email, 'login', 10);
      
      // Send OTP email
      try {
        const userName = `${user.first_name} ${user.last_name}`;
        await EmailService.sendOTPEmail(email, otpRecord.code, userName);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Still return success to not reveal email issues
        return res.json({
          message: 'If the email exists, an OTP code has been sent.',
          // In development, return OTP for testing
          ...(process.env.NODE_ENV === 'development' && { 
            otp: otpRecord.code,
            note: 'OTP shown only in development mode'
          }),
        });
      }

      return res.json({
        message: 'OTP code has been sent to your email. Please check your inbox.',
        expiresIn: 10, // minutes
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { 
          otp: otpRecord.code,
          note: 'OTP shown only in development mode'
        }),
      });
    } catch (error) {
      console.error('Request OTP error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Login with OTP
   */
  async loginWithOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP code are required' });
      }

      // Verify OTP
      const otpVerification = await OTPModel.verifyOTP(email, otp, 'login');
      if (!otpVerification.valid) {
        return res.status(401).json({ error: otpVerification.message });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is approved and active
      if (user.role === 'instructor' && !user.admin_approved) {
        return res.status(403).json({
          error: 'Your account is pending approval. Please wait for administrator approval.',
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          error: `Your account is ${user.status}. Please contact administrator.`,
        });
      }

      // Update last login
      await UserModel.updateLastLogin(user.user_id);

      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error('Login with OTP error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      } catch (error) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Find user by email
      const user = await UserModel.findByEmail(decoded.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify email
      await UserModel.verifyEmail(user.user_id);

      return res.json({
        message: 'Email verified successfully',
        user: {
          user_id: user.user_id,
          email: user.email,
          email_verified: true,
        },
      });
    } catch (error) {
      console.error('Verify email error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new AuthController();

