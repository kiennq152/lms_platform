/**
 * Auth Routes (MVC Pattern)
 * Routes only handle HTTP concerns, business logic in controllers
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['student', 'instructor']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      await AuthController.register(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post('/login', async (req, res, next) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    await AuthController.getMe(req, res);
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email', async (req, res, next) => {
  try {
    await AuthController.verifyEmail(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;

