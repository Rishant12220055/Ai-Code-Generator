import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import configurations
import database from './config/database.js';
import redisClient from './config/redis.js';
import { logger } from './utils/logger.js';

// Import middleware
import { generalLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import messageRoutes from './routes/messages.js';
import generateComponentRoutes from './routes/generateComponent.js';

// Load environment variables
dotenv.config();

console.log('Loaded Environment Variables:', process.env);

class AppServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.port = process.env.PORT || 5000;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    const corsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'http://localhost:3001'
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    this.app.use(cors(corsOptions));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.http(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  initializeRoutes() {
    const apiPrefix = `/api/${process.env.API_VERSION || 'v1'}`;

    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/sessions`, sessionRoutes);
    this.app.use(`${apiPrefix}/messages`, messageRoutes);
    this.app.use(`${apiPrefix}/generate-component`, generateComponentRoutes);

    // API documentation endpoint
    this.app.get(`${apiPrefix}/docs`, (req, res) => {
      res.json({
        name: 'Component Generator API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'AI-driven component generator platform API',
        endpoints: {
          auth: {
            'POST /auth/register': 'Register a new user',
            'POST /auth/login': 'Login user',
            'POST /auth/logout': 'Logout user',
            'GET /auth/profile': 'Get user profile',
            'PUT /auth/profile': 'Update user profile'
          },
          sessions: {
            'GET /sessions': 'Get user sessions',
            'POST /sessions': 'Create new session',
            'GET /sessions/:id': 'Get specific session',
            'PUT /sessions/:id': 'Update session',
            'DELETE /sessions/:id': 'Delete session'
          },
          messages: {
            'POST /sessions/:id/messages': 'Send message to AI',
            'GET /sessions/:id/messages': 'Get session messages',
            'PUT /sessions/:id/messages/:messageId': 'Edit message',
            'DELETE /sessions/:id/messages/:messageId': 'Delete message'
          }
        }
      });
    });

    // 404 handler for API routes
    this.app.use(`${apiPrefix}/*`, (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Component Generator API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'Running',
        docs: `${req.protocol}://${req.get('host')}/api/v1/docs`
      });
    });
  }

  initializeErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format'
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate field value'
        });
      }

      if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
          success: false,
          message: 'CORS policy violation'
        });
      }

      // Default error response
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    // 404 handler for non-API routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  initializeSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Join user to their personal room
      socket.on('join-user-room', (userId) => {
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} joined their room`);
      });

      // Join session room for real-time updates
      socket.on('join-session', (sessionId) => {
        socket.join(`session:${sessionId}`);
        logger.info(`Socket ${socket.id} joined session: ${sessionId}`);
      });

      // Leave session room
      socket.on('leave-session', (sessionId) => {
        socket.leave(`session:${sessionId}`);
        logger.info(`Socket ${socket.id} left session: ${sessionId}`);
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        socket.to(`session:${data.sessionId}`).emit('user-typing', {
          userId: data.userId,
          userName: data.userName
        });
      });

      socket.on('typing-stop', (data) => {
        socket.to(`session:${data.sessionId}`).emit('user-stopped-typing', {
          userId: data.userId
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  async start() {
    try {
      // Connect to databases
      await database.connect();
      await redisClient.connect();

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📚 API Documentation: http://localhost:${this.port}/api/v1/docs`);
        logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Close server
    this.server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close database connections
    try {
      await database.disconnect();
      await redisClient.disconnect();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }

    process.exit(0);
  }
}

// Start server
const server = new AppServer();
server.start();

export default server;