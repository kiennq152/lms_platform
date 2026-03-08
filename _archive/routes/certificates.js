import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get certificates for current user (student)
router.get('/', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.certificate_id,
        c.course_id,
        co.title as course_title,
        c.issued_date,
        c.certificate_url,
        c.certificate_number
      FROM certificates c
      JOIN courses co ON c.course_id = co.course_id
      WHERE c.student_id = $1
      ORDER BY c.issued_date DESC`,
      [req.user.user_id]
    );

    res.json({ certificates: result.rows });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single certificate
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        co.title as course_title,
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email
      FROM certificates c
      JOIN courses co ON c.course_id = co.course_id
      JOIN users u ON c.student_id = u.user_id
      WHERE c.certificate_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check if user owns this certificate or is admin/instructor
    const certificate = result.rows[0];
    if (certificate.student_id !== req.user.user_id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ certificate: certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate certificate (automatically called when course is completed)
router.post('/', authenticate, authorize('student'), async (req, res) => {
  try {
    const { course_id } = req.body;

    // Check if student is enrolled and course is completed
    const enrollmentCheck = await pool.query(
      `SELECT e.*, co.title as course_title
       FROM enrollments e
       JOIN courses co ON e.course_id = co.course_id
       WHERE e.student_id = $1 AND e.course_id = $2`,
      [req.user.user_id, course_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const enrollment = enrollmentCheck.rows[0];

    // Check if course is completed (progress >= 100%)
    if (enrollment.progress_percentage < 100) {
      return res.status(400).json({ error: 'Course not completed yet' });
    }

    // Check if certificate already exists
    const existingCert = await pool.query(
      'SELECT certificate_id FROM certificates WHERE student_id = $1 AND course_id = $2',
      [req.user.user_id, course_id]
    );

    if (existingCert.rows.length > 0) {
      return res.status(400).json({ error: 'Certificate already issued' });
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create certificate
    const result = await pool.query(
      `INSERT INTO certificates (enrollment_id, student_id, course_id, certificate_number, issued_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING *`,
      [enrollment.enrollment_id, req.user.user_id, course_id, certificateNumber]
    );

    const certificate = result.rows[0];
    certificate.certificate_url = `/api/certificates/${certificate.certificate_id}/download`;

    res.status(201).json({ 
      certificate: certificate,
      message: 'Certificate generated successfully'
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download certificate (generate PDF)
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        c.*,
        co.title as course_title,
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email
      FROM certificates c
      JOIN courses co ON c.course_id = co.course_id
      JOIN users u ON c.student_id = u.user_id
      WHERE c.certificate_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = result.rows[0];

    // Check ownership
    if (certificate.student_id !== req.user.user_id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // TODO: Generate PDF certificate
    // For now, return JSON with certificate data
    // In production, use a library like pdfkit or puppeteer to generate PDF
    
    res.json({
      certificate: certificate,
      downloadUrl: `/api/certificates/${id}/pdf`, // Placeholder
      message: 'PDF generation not yet implemented. Certificate data available.'
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify certificate by verification code (public endpoint)
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT 
        c.*,
        co.title as course_title,
        u.first_name || ' ' || u.last_name as student_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.course_id
      JOIN users u ON c.student_id = u.user_id
      WHERE c.certificate_number = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found or invalid verification code' });
    }

    res.json({ 
      certificate: result.rows[0],
      verified: true
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

