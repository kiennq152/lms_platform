/**
 * Unit Tests for Authentication Functions
 * Tests: Password hashing, JWT generation, token validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Authentication Unit Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'Test123!@#';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify hashed password correctly', async () => {
      const password = 'Test123!@#';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test123!@#';
      const wrongPassword = 'WrongPassword123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test123!@#';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const payload = {
        user_id: 1,
        email: 'test@example.com',
        role: 'student',
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should decode JWT token correctly', () => {
      const payload = {
        user_id: 1,
        email: 'test@example.com',
        role: 'student',
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.user_id).toBe(payload.user_id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });

    it('should reject expired JWT token', () => {
      const payload = {
        user_id: 1,
        email: 'test@example.com',
        role: 'student',
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' }); // Expired
      
      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });

    it('should reject token with wrong secret', () => {
      const payload = {
        user_id: 1,
        email: 'test@example.com',
        role: 'student',
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];
      
      validEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@domain',
        'user name@example.com',
      ];
      
      invalidEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate password length', () => {
      const minLength = 6;
      const validPasswords = ['123456', 'password123', 'Test123!@#'];
      const invalidPasswords = ['12345', 'pass', 'abc'];
      
      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(minLength);
      });
      
      invalidPasswords.forEach(password => {
        expect(password.length).toBeLessThan(minLength);
      });
    });
  });
});

