import Session from '../models/Session.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'user' } = req.body;
    const userId = req.user.id;

    // Get session
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid content'
      });
    }

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    await session.addMessage(userMessage);

    // Generate AI response
    try {
      let componentData;
      
      if (session.currentComponent) {
        // Refine existing component
        componentData = await aiService.refineComponent(
          content,
          session.currentComponent,
          session.messages,
          session.settings
        );
      } else {
        // Generate new component
        componentData = await aiService.generateComponent(
          content,
          session.messages,
          session.settings
        );
      }

      // Update session with new component
      await session.updateComponent(componentData);

      // Add assistant message
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I've ${session.currentComponent ? 'refined' : 'created'} the ${componentData.name} component for you! ${componentData.description}`,
        timestamp: new Date().toISOString(),
        componentCode: componentData,
        metadata: componentData.metadata
      };

      await session.addMessage(assistantMessage);

      // Update user usage statistics
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'usage.totalComponents': 1,
          'usage.totalTokens': componentData.metadata?.tokens || 0
        }
      });

      // Update cache
      await redisClient.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        3600
      );

      logger.info(`Message processed for session: ${sessionId}, tokens used: ${componentData.metadata?.tokens || 0}`);

      res.json({
        success: true,
        message: 'Message sent and processed successfully',
        data: {
          userMessage,
          assistantMessage,
          component: componentData,
          session: {
            id: session._id,
            currentComponent: session.currentComponent,
            metadata: session.metadata
          }
        }
      });

    } catch (aiError) {
      logger.error('AI processing error:', aiError);

      // Add error message to session
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again with a different prompt or check your message.',
        timestamp: new Date().toISOString()
      };

      await session.addMessage(errorMessage);

      res.status(500).json({
        success: false,
        message: 'Failed to process AI request',
        data: {
          userMessage,
          errorMessage
        },
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined
      });
    }

  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Paginate messages
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const messages = session.messages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: session.messages.length,
          pages: Math.ceil(session.messages.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Find and remove message
    const messageIndex = session.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    session.messages.splice(messageIndex, 1);
    await session.save();

    // Update cache
    await redisClient.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      3600
    );

    logger.info(`Message deleted: ${messageId} from session: ${sessionId}`);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Find and update message
    const message = session.messages.find(msg => msg.id === messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only allow editing user messages
    if (message.type !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Only user messages can be edited'
      });
    }

    message.content = content;
    message.timestamp = new Date().toISOString();
    
    await session.save();

    // Update cache
    await redisClient.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      3600
    );

    logger.info(`Message edited: ${messageId} in session: ${sessionId}`);

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        message
      }
    });

  } catch (error) {
    logger.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const regenerateResponse = async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Find the user message to regenerate response for
    const messageIndex = session.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const userMessage = session.messages[messageIndex];
    if (userMessage.type !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Can only regenerate responses for user messages'
      });
    }

    // Remove all messages after this user message
    session.messages = session.messages.slice(0, messageIndex + 1);

    // Get messages before this one for context
    const contextMessages = session.messages.slice(0, messageIndex);

    try {
      let componentData;
      
      if (session.currentComponent) {
        componentData = await aiService.refineComponent(
          userMessage.content,
          session.currentComponent,
          contextMessages,
          session.settings
        );
      } else {
        componentData = await aiService.generateComponent(
          userMessage.content,
          contextMessages,
          session.settings
        );
      }

      // Update session with new component
      await session.updateComponent(componentData);

      // Add new assistant message
      const assistantMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I've ${session.currentComponent ? 'refined' : 'created'} the ${componentData.name} component for you! ${componentData.description}`,
        timestamp: new Date().toISOString(),
        componentCode: componentData,
        metadata: componentData.metadata
      };

      await session.addMessage(assistantMessage);

      // Update cache
      await redisClient.set(
        `session:${sessionId}`,
        JSON.stringify(session),
        3600
      );

      logger.info(`Response regenerated for message: ${messageId} in session: ${sessionId}`);

      res.json({
        success: true,
        message: 'Response regenerated successfully',
        data: {
          assistantMessage,
          component: componentData
        }
      });

    } catch (aiError) {
      logger.error('AI regeneration error:', aiError);
      
      const errorMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while regenerating the response. Please try again.',
        timestamp: new Date().toISOString()
      };

      await session.addMessage(errorMessage);

      res.status(500).json({
        success: false,
        message: 'Failed to regenerate response',
        data: {
          errorMessage
        },
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined
      });
    }

  } catch (error) {
    logger.error('Regenerate response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};