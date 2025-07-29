import mongoose from 'mongoose';

const propertyEditSchema = new mongoose.Schema({
  elementId: {
    type: String,
    required: true
  },
  property: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
    maxlength: [100, 'Component name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Component description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  jsx: {
    type: String,
    required: [true, 'JSX code is required']
  },
  css: {
    type: String,
    required: [true, 'CSS code is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session ID is required'],
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  parentComponentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['button', 'form', 'card', 'navigation', 'layout', 'data-display', 'feedback', 'other'],
    default: 'other'
  },
  complexity: {
    type: String,
    enum: ['simple', 'medium', 'complex'],
    default: 'simple'
  },
  propertyEdits: [propertyEditSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  usage: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    copies: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    generatedBy: {
      type: String,
      default: 'ai'
    },
    model: String,
    prompt: String,
    tokens: Number,
    processingTime: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
componentSchema.index({ userId: 1, createdAt: -1 });
componentSchema.index({ sessionId: 1 });
componentSchema.index({ category: 1, isPublic: 1 });
componentSchema.index({ tags: 1 });
componentSchema.index({ isTemplate: 1, isPublic: 1 });
componentSchema.index({ 'usage.views': -1 });

// Virtual for user
componentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for session
componentSchema.virtual('session', {
  ref: 'Session',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true
});

// Virtual for child components
componentSchema.virtual('childComponents', {
  ref: 'Component',
  localField: '_id',
  foreignField: 'parentComponentId'
});

// Instance method to increment usage
componentSchema.methods.incrementUsage = function(type) {
  if (['views', 'downloads', 'copies'].includes(type)) {
    this.usage[type] += 1;
    return this.save({ validateBeforeSave: false });
  }
};

// Instance method to add property edit
componentSchema.methods.addPropertyEdit = function(editData) {
  this.propertyEdits.push({
    elementId: editData.elementId,
    property: editData.property,
    value: editData.value,
    timestamp: new Date()
  });
  
  return this.save();
};

// Static method to find public components
componentSchema.statics.findPublic = function(category = null, limit = 20) {
  const query = { isPublic: true };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ 'usage.views': -1, createdAt: -1 })
    .limit(limit)
    .populate('user', 'name');
};

// Static method to find templates
componentSchema.statics.findTemplates = function(category = null) {
  const query = { isTemplate: true, isPublic: true };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ 'usage.views': -1 })
    .populate('user', 'name');
};

// Static method to search components
componentSchema.statics.search = function(searchTerm, userId = null) {
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  
  if (userId) {
    query.$and = [
      { $or: [{ userId }, { isPublic: true }] }
    ];
  } else {
    query.isPublic = true;
  }
  
  return this.find(query)
    .sort({ 'usage.views': -1, createdAt: -1 })
    .populate('user', 'name');
};

export default mongoose.model('Component', componentSchema);