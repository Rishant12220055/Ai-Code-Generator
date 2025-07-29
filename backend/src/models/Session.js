import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  componentCode: {
    id: String,
    jsx: String,
    css: String,
    name: String,
    description: String
  },
  metadata: {
    tokens: Number,
    model: String,
    processingTime: Number
  }
}, { _id: false });

const componentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  jsx: {
    type: String,
    required: true
  },
  css: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
    maxlength: [200, 'Session name cannot exceed 200 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  messages: [messageSchema],
  currentComponent: componentSchema,
  componentHistory: [componentSchema],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  settings: {
    model: {
      type: String,
      default: 'gpt-4o-mini'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 2000
    }
  },
  metadata: {
    totalTokens: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ 'metadata.lastActivity': -1 });
sessionSchema.index({ status: 1 });

// Virtual for user
sessionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update metadata
sessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.metadata.totalMessages = this.messages.length;
    this.metadata.lastActivity = new Date();
    
    // Calculate total tokens
    this.metadata.totalTokens = this.messages.reduce((total, message) => {
      return total + (message.metadata?.tokens || 0);
    }, 0);
  }
  next();
});

// Instance method to add message
sessionSchema.methods.addMessage = function(messageData) {
  this.messages.push({
    id: messageData.id || new mongoose.Types.ObjectId().toString(),
    type: messageData.type,
    content: messageData.content,
    timestamp: messageData.timestamp || new Date(),
    componentCode: messageData.componentCode,
    metadata: messageData.metadata
  });
  
  return this.save();
};

// Instance method to update component
sessionSchema.methods.updateComponent = function(componentData) {
  // Save current component to history if it exists
  if (this.currentComponent) {
    this.componentHistory.push({
      ...this.currentComponent.toObject(),
      version: this.componentHistory.length + 1
    });
  }
  
  this.currentComponent = {
    id: componentData.id || new mongoose.Types.ObjectId().toString(),
    jsx: componentData.jsx,
    css: componentData.css,
    name: componentData.name,
    description: componentData.description,
    version: this.componentHistory.length + 1,
    createdAt: new Date()
  };
  
  return this.save();
};

// Static method to find user sessions
sessionSchema.statics.findByUser = function(userId, status = 'active') {
  return this.find({ userId, status }).sort({ 'metadata.lastActivity': -1 });
};

// Static method to find recent sessions
sessionSchema.statics.findRecent = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'metadata.lastActivity': -1 })
    .limit(limit)
    .populate('user', 'name email');
};

export default mongoose.model('Session', sessionSchema);