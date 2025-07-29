import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';

// Generate JWT tokens
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Cache user data in Redis for faster subsequent requests
    await redisClient.set(
      `user:${user._id}`,
      JSON.stringify(user),
      3600 // 1 hour
    );

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from cache first
    let user = await redisClient.get(`user:${decoded.userId}`);
    if (user) {
      user = JSON.parse(user);
    } else {
      user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        await redisClient.set(
          `user:${user._id}`,
          JSON.stringify(user),
          3600
        );
      }
    }

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Logout middleware (blacklist token)
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      // Calculate remaining TTL
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;
      
      if (ttl > 0) {
        // Add token to blacklist
        await redisClient.set(`blacklist:${token}`, 'true', ttl);
      }
      
      // Remove user from cache
      await redisClient.del(`user:${decoded.userId}`);
    }

    next();
  } catch (error) {
    logger.error('Logout error:', error);
    next();
  }
};