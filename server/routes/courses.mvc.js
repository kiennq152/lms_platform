/**
 * Course Routes (MVC Pattern)
 * Routes only handle HTTP concerns, business logic in controllers
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import CourseController from '../controllers/CourseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all courses (public)
router.get('/', async (req, res, next) => {
  try {
    await CourseController.getAllCourses(req, res);
  } catch (error) {
    next(error);
  }
});

// Get course by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    await CourseController.getCourseById(req, res);
  } catch (error) {
    next(error);
  }
});

// Create course (instructor/admin only)
router.post(
  '/',
  authenticate,
  authorize('instructor', 'admin'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      await CourseController.createCourse(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update course (instructor/admin only)
router.put(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  async (req, res, next) => {
    try {
      await CourseController.updateCourse(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Delete course (instructor/admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  async (req, res, next) => {
    try {
      await CourseController.deleteCourse(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

