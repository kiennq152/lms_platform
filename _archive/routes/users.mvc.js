/**
 * User Routes (MVC Pattern)
 * Routes for user management (admin and user operations)
 */
import express from 'express';
import { body } from 'express-validator';
import UserController from '../controllers/UserController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await UserController.getAllUsers(req, res);
  } catch (error) {
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await UserController.getUserById(req, res);
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['student', 'instructor', 'admin']),
  ],
  async (req, res, next) => {
    try {
      await UserController.createUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update user (admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['student', 'instructor', 'admin']),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
  ],
  async (req, res, next) => {
    try {
      await UserController.updateUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update user password (admin only)
router.put(
  '/:id/password',
  authenticate,
  authorize('admin'),
  [body('password').isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      await UserController.updateUserPassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Approve user (admin only)
router.post('/:id/approve', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await UserController.approveUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Reject user (admin only)
router.post('/:id/reject', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await UserController.rejectUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Update user status (admin only)
router.put(
  '/:id/status',
  authenticate,
  authorize('admin'),
  [body('status').isIn(['active', 'inactive', 'suspended'])],
  async (req, res, next) => {
    try {
      await UserController.updateUserStatus(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (admin only) - Soft delete
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await UserController.deleteUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    await UserController.getCurrentUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Update current user profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    await UserController.updateCurrentUser(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;

