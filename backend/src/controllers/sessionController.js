import Session from '../models/Session.js';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const createSession = async (req, res) => {
  try {
    const { name, settings = {} } = req.body;
    const userId = req.user.id;

    // Validate settings
    if (typeof settings !== 'object' || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings'
      });
    }

    const session = new Session({
      name,
      userId,
      settings: {
        model: settings.model || 'gpt-4o-mini',
        temperature: settings.temperature || 0.7,
        maxTokens: settings.maxTokens || 2000
      }
    });

    await session.save();

    // Update user's session count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'usage.totalSessions': 1 }
    });

    // Cache session data
    await redisClient.set(
      `session:${session._id}`,
      JSON.stringify(session),
      3600 // 1 hour
    );

    logger.info(`New session created: ${session._id} by user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: {
        session
      }
    });

  } catch (error) {
    logger.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, sort = '-updatedAt', status = 'active' } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'user',
        select: 'name email'
      }
    };

    const query = { userId, status };
    
    const sessions = await Session.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .exec();

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Try to get from cache first
    let session = await redisClient.get(`session:${sessionId}`);
    
    if (session) {
      session = JSON.parse(session);
      
      // Verify ownership
      if (session.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else {
      // Get from database
      session = await Session.findOne({ _id: sessionId, userId })
        .populate('user', 'name email');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Cache the session
      await redisClient.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        3600
      );
    }

    res.json({
      success: true,
      data: {
        session
      }
    });

  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, settings } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (settings) updateData.settings = settings;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update cache
    await redisClient.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      3600
    );

    logger.info(`Session updated: ${sessionId} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: {
        session
      }
    });

  } catch (error) {
    logger.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      { status: 'deleted' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Remove from cache
    await redisClient.del(`session:${sessionId}`);

    logger.info(`Session deleted: ${sessionId} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    logger.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const archiveSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      { status: 'archived' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update cache
    await redisClient.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      3600
    );

    logger.info(`Session archived: ${sessionId} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Session archived successfully',
      data: {
        session
      }
    });

  } catch (error) {
    logger.error('Archive session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const duplicateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const originalSession = await Session.findOne({ _id: sessionId, userId });

    if (!originalSession) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const duplicatedSession = new Session({
      name: `${originalSession.name} (Copy)`,
      userId,
      messages: originalSession.messages,
      currentComponent: originalSession.currentComponent,
      componentHistory: originalSession.componentHistory,
      settings: originalSession.settings
    });

    await duplicatedSession.save();

    logger.info(`Session duplicated: ${sessionId} -> ${duplicatedSession._id} by user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Session duplicated successfully',
      data: {
        session: duplicatedSession
      }
    });

  } catch (error) {
    logger.error('Duplicate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getSessionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Session.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMessages: { $sum: '$metadata.totalMessages' },
          totalTokens: { $sum: '$metadata.totalTokens' }
        }
      }
    ]);

    const recentActivity = await Session.find({ userId })
      .sort({ 'metadata.lastActivity': -1 })
      .limit(5)
      .select('name metadata.lastActivity metadata.totalMessages');

    res.json({
      success: true,
      data: {
        stats,
        recentActivity
      }
    });

  } catch (error) {
    logger.error('Get session stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};