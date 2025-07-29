import User from '../models/User.js';
import { generateTokens } from '../middleware/auth.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { getAccountBalances } from '../services/geminiService.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Do NOT hash password here; let the pre-save hook handle it
    const user = new User({
      name,
      email,
      password, // plain password
      isActive: true // Ensure user is active by default
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Cache user data
    await redisClient.set(
      `user:${user._id}`,
      JSON.stringify(user),
      3600 // 1 hour
    );

    // Update last login
    await user.updateLastLogin();

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
          createdAt: user.createdAt
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('DEBUG: No user found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (user not found)'
      });
    }
    if (!user.isActive) {
      console.log('DEBUG: User is not active:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (user not active)'
      });
    }

    // Check password
    console.log('DEBUG: Candidate Password:', password);
    console.log('DEBUG: Stored Password Hash:', user.password);
    const isPasswordValid = await user.comparePassword(password);
    console.log('DEBUG: Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (password mismatch)'
      });
    }


    // (Removed Gemini account balances call)

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Cache user data
    await redisClient.set(
      `user:${user._id}`,
      JSON.stringify(user),
      3600 // 1 hour
    );

    // Update last login
    await user.updateLastLogin();

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          usage: user.usage
        },
        tokens: {
          accessToken,
          refreshToken
        },
        // Gemini balances removed
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Token blacklisting is handled by the logout middleware
    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('sessions', 'name createdAt updatedAt')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update cache
    await redisClient.set(
      `user:${user._id}`,
      JSON.stringify(user),
      3600
    );

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    // Remove from cache
    await redisClient.del(`user:${userId}`);

    logger.info(`Account deleted for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};