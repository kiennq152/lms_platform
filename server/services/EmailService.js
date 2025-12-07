/**
 * Email Service
 * Handles email sending via Gmail SMTP
 */
import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD;

      if (!emailUser || !emailPassword) {
        console.warn('⚠️  Email service not configured. EMAIL_USER and EMAIL_PASSWORD not set in .env');
        console.warn('💡 OTP codes will be shown in console/API response in development mode');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        // Add timeout and connection options
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error.message);
          console.error('💡 Common issues:');
          console.error('   1. Wrong App Password (must be 16 characters, no spaces)');
          console.error('   2. 2-Step Verification not enabled');
          console.error('   3. "Less secure app access" needs to be enabled (if not using App Password)');
          console.error('   4. Check EMAIL_USER and EMAIL_PASSWORD in .env file');
          this.transporter = null; // Disable transporter on error
        } else {
          console.log('✅ Email service ready');
          console.log(`📧 Sending emails from: ${emailUser}`);
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured() {
    return this.transporter !== null;
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      const error = new Error('Email service not configured');
      error.code = 'EMAIL_NOT_CONFIGURED';
      throw error;
    }

    try {
      const mailOptions = {
        from: `"VIAN Academy LMS" <${process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      console.log(`📧 Attempting to send email to: ${to}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      return info;
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Full error:', error);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Cannot connect to email server. Check your internet connection.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Email server connection timeout. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email, otpCode, userName = 'User', purpose = 'login') {
    const isRegistration = purpose === 'registration';
    const subject = isRegistration 
      ? 'Verify Your Email - VIAN Academy LMS'
      : 'Your Login OTP Code - VIAN Academy LMS';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #1E3A8A; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #1E3A8A; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 VIAN Academy LMS</h1>
            <p>${isRegistration ? 'Email Verification' : 'Login Verification Code'}</p>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>${isRegistration 
              ? 'Thank you for registering! Use the code below to verify your email address:'
              : 'You requested a login verification code. Use the code below to complete your login:'}</p>
            
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code will expire in ${isRegistration ? '15' : '10'} minutes</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            ${isRegistration 
              ? '<p>After verifying your email, you will be able to login to your account.</p>'
              : '<p>If you didn\'t request this code, please contact support immediately.</p>'}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} VIAN Academy LMS. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken, userName = 'User') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request - VIAN Academy LMS';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #1E3A8A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1E3A8A;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} VIAN Academy LMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

export default new EmailService();

