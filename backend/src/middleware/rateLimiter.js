import rateLimit from 'express-rate-limit';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';

// Redis store for rate limiting
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.client = redisClient;
  }

  async increment(key) {
    try {
      const fullKey = this.prefix + key;
      const current = await this.client.get(fullKey);
      
      if (current === null) {
        await this.client.set(fullKey, '1', 'EX', 900); // 15 minutes
        return { totalHits: 1, resetTime: new Date(Date.now() + 900000) };
      }
      
      const totalHits = await this.client.incr(fullKey);
      const ttl = await this.client.ttl(fullKey);
      const resetTime = new Date(Date.now() + (ttl * 1000));
      
      return { totalHits, resetTime };
    } catch (error) {
      logger.error('Redis rate limiter error:', error);
      // Fallback to memory-based limiting
      return { totalHits: 1, resetTime: new Date(Date.now() + 900000) };
    }
  }

  async decrement(key) {
    try {
      const fullKey = this.prefix + key;
      await this.client.decr(fullKey);
    } catch (error) {
      logger.error('Redis rate limiter decrement error:', error);
    }
  }

  async resetKey(key) {
    try {
      const fullKey = this.prefix + key;
      await this.client.del(fullKey);
    } catch (error) {
      logger.error('Redis rate limiter reset error:', error);
    }
  }
}

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isConnected ? new RedisStore() : undefined,
  keyGenerator: (req) => {
    return req.ip + ':general';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Authentication rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isConnected ? new RedisStore({ prefix: 'auth:' }) : undefined,
  keyGenerator: (req) => {
    return req.ip + ':auth';
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// AI generation rate limiter
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 AI requests per minute
  message: {
    success: false,
    message: 'Too many AI generation requests, please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isConnected ? new RedisStore({ prefix: 'ai:' }) : undefined,
  keyGenerator: (req) => {
    return (req.user?.id || req.ip) + ':ai';
  },
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many AI generation requests, please wait before trying again.',
      retryAfter: '1 minute'
    });
  }
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each user to 5 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isConnected ? new RedisStore({ prefix: 'upload:' }) : undefined,
  keyGenerator: (req) => {
    return (req.user?.id || req.ip) + ':upload';
  },
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please wait before trying again.',
      retryAfter: '1 minute'
    });
  }
});

// Export rate limiter
export const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each user to 20 exports per 5 minutes
  message: {
    success: false,
    message: 'Too many export requests, please wait before trying again.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isConnected ? new RedisStore({ prefix: 'export:' }) : undefined,
  keyGenerator: (req) => {
    return (req.user?.id || req.ip) + ':export';
  },
  handler: (req, res) => {
    logger.warn(`Export rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many export requests, please wait before trying again.',
      retryAfter: '5 minutes'
    });
  }
});