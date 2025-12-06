/**
 * OTP Model
 * Handles OTP code storage and validation
 */
import pool from '../config/database.js';

export class OTPModel {
  constructor() {
    this.pool = pool;
    this.tableName = 'otp_codes';
    this.initializeTable();
  }

  /**
   * Execute query
   */
  async query(text, params) {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('OTP query error:', error);
      throw error;
    }
  }

  /**
   * Initialize OTP table if it doesn't exist
   */
  async initializeTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS otp_codes (
        otp_id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) DEFAULT 'login',
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_otp_email_code ON otp_codes(email, code);
      CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
    `;
    
    try {
      await this.query(query);
      console.log('✅ OTP table initialized');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('OTP table creation error:', error);
      }
    }
  }

  /**
   * Create OTP code
   */
  async createOTP(email, purpose = 'login', expiresInMinutes = 10) {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Invalidate previous unused OTPs for this email and purpose
    await this.query(
      `UPDATE otp_codes SET used = TRUE 
       WHERE email = $1 AND purpose = $2 AND used = FALSE AND expires_at > NOW()`,
      [email, purpose]
    );

    // Insert new OTP
    const result = await this.query(
      `INSERT INTO otp_codes (email, code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, code, purpose, expiresAt]
    );

    return result.rows[0];
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email, code, purpose = 'login') {
    const result = await this.query(
      `SELECT * FROM otp_codes
       WHERE email = $1 AND code = $2 AND purpose = $3 
       AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code, purpose]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: 'Invalid or expired OTP code' };
    }

    const otp = result.rows[0];

    // Mark as used
    await this.query(
      'UPDATE otp_codes SET used = TRUE WHERE otp_id = $1',
      [otp.otp_id]
    );

    return { valid: true, otp };
  }

  /**
   * Clean expired OTPs
   */
  async cleanExpiredOTPs() {
    await this.query(
      'DELETE FROM otp_codes WHERE expires_at < NOW() OR used = TRUE'
    );
  }

  /**
   * Get latest OTP for email
   */
  async getLatestOTP(email, purpose = 'login') {
    const result = await this.query(
      `SELECT * FROM otp_codes
       WHERE email = $1 AND purpose = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, purpose]
    );

    return result.rows[0] || null;
  }
}

export default new OTPModel();
