/**
 * User Controller
 * Handles user management business logic
 */
import UserModel from '../models/UserModel.js';

export class UserController {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(req, res) {
    try {
      const { role, status, search } = req.query;

      let users;
      if (search) {
        // Search users by email, first_name, or last_name
        users = await UserModel.searchUsers(search, { role, status });
      } else {
        // Get users with filters
        const conditions = {};
        if (role) conditions.role = role;
        if (status) conditions.status = status;

        users = await UserModel.findAll(conditions, {
          orderBy: 'created_at DESC',
        });
      }

      // Exclude password_hash from response
      const sanitizedUsers = users.map(user => {
        const { password_hash, ...userData } = user;
        return userData;
      });

      return res.json({ users: sanitizedUsers });
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude password_hash from response
      const { password_hash, ...userData } = user;

      return res.json({ user: userData });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create user (admin only)
   * Allows admin to create students, instructors, or other admins
   */
  async createUser(req, res) {
    try {
      const { email, password, firstName, lastName, role, phone, bio, status, adminApproved } = req.body;
      const adminId = req.user.user_id;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ error: 'Email, password, firstName, lastName, and role are required' });
      }

      // Validate role
      if (!['student', 'instructor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be student, instructor, or admin' });
      }

      // Validate status if provided
      if (status && !['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended' });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Determine admin_approved based on role and adminApproved parameter
      let admin_approved = false;
      if (role === 'student') {
        admin_approved = true; // Students auto-approved
      } else if (adminApproved !== undefined) {
        admin_approved = adminApproved;
      } else if (role === 'admin') {
        admin_approved = true; // Admins created by admins are auto-approved
      }

      // Create user
      const userData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        phone: phone || null,
        bio: bio || null,
        status: status || 'active',
        admin_approved,
        email_verified: true, // Admin-created users are considered verified
        approved_by: (role === 'instructor' || role === 'admin') && admin_approved ? adminId : null,
      };

      const user = await UserModel.createUser(userData);

      // Exclude password_hash from response
      const { password_hash, ...userResponse } = user;

      return res.status(201).json({
        message: 'User created successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Create user error:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, bio, role, status, adminApproved } = req.body;
      const adminId = req.user.user_id;

      // Check if user exists
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build update data
      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (email !== undefined) {
        // Check if email is already taken by another user
        const emailUser = await UserModel.findByEmail(email);
        if (emailUser && emailUser.user_id !== parseInt(id)) {
          return res.status(409).json({ error: 'Email already taken by another user' });
        }
        updateData.email = email;
      }
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;

      // Handle role changes (admin only)
      if (role !== undefined) {
        if (!['student', 'instructor', 'admin'].includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }
        updateData.role = role;

        // Update admin_approved based on role
        if (role === 'student') {
          updateData.admin_approved = true;
        } else if (adminApproved !== undefined) {
          updateData.admin_approved = adminApproved;
          if (adminApproved) {
            updateData.approved_by = adminId;
            updateData.admin_approved_at = new Date();
          } else {
            updateData.approved_by = null;
            updateData.admin_approved_at = null;
          }
        }
      }

      // Handle status changes
      if (status !== undefined) {
        if (!['active', 'inactive', 'suspended'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        updateData.status = status;
      }

      // Handle admin approval changes
      if (adminApproved !== undefined && role === undefined) {
        updateData.admin_approved = adminApproved;
        if (adminApproved) {
          updateData.approved_by = adminId;
          updateData.admin_approved_at = new Date();
        } else {
          updateData.approved_by = null;
          updateData.admin_approved_at = null;
        }
      }

      // Update user
      const updatedUser = await UserModel.update(id, updateData, 'user_id');

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude password_hash from response
      const { password_hash, ...userResponse } = updatedUser;

      return res.json({
        message: 'User updated successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Update user error:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already taken by another user' });
      }

      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update user password (admin only)
   */
  async updateUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password is required and must be at least 6 characters' });
      }

      // Check if user exists
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update password
      await UserModel.updatePassword(id, password);

      return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Approve user (admin only)
   */
  async approveUser(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.user_id;

      const user = await UserModel.approveUser(id, adminId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude password_hash from response
      const { password_hash, ...userResponse } = user;

      return res.json({
        message: 'User approved successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Approve user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Reject user (admin only)
   */
  async rejectUser(req, res) {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await UserModel.update(
        id,
        {
          admin_approved: false,
          admin_approved_at: null,
          approved_by: null,
        },
        'user_id'
      );

      // Exclude password_hash from response
      const { password_hash, ...userResponse } = updatedUser;

      return res.json({
        message: 'User rejected successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Reject user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or suspended' });
      }

      const user = await UserModel.updateStatus(id, status);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude password_hash from response
      const { password_hash, ...userResponse } = user;

      return res.json({
        message: 'User status updated successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Update user status error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete user (admin only) - Soft delete
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent deleting admin/guest accounts (check by email)
      if (user.email === 'admin' || user.email === 'guest') {
        return res.status(400).json({ error: 'Cannot delete admin or guest accounts' });
      }

      // Prevent self-deletion
      if (parseInt(id) === req.user.user_id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Soft delete: set status to inactive
      const deletedUser = await UserModel.updateStatus(id, 'inactive');

      // Exclude password_hash from response
      const { password_hash, ...userResponse } = deletedUser;

      return res.json({
        message: 'User deleted successfully (status set to inactive)',
        user: userResponse,
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.user_id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude password_hash from response
      const { password_hash, ...userData } = user;

      return res.json({ user: userData });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(req, res) {
    try {
      const userId = req.user.user_id;
      const { firstName, lastName, phone, bio, socialLink, avatarUrl } = req.body;

      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      if (socialLink !== undefined) updateData.social_link = socialLink;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const user = await UserModel.update(userId, updateData, 'user_id');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude password_hash from response
      const { password_hash, ...userData } = user;

      return res.json({
        message: 'Profile updated successfully',
        user: userData,
      });
    } catch (error) {
      console.error('Update current user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new UserController();

