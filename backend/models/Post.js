const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [300, 'Reply cannot exceed 300 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  caption: {
    type: String,
    maxlength: [1000, 'Caption cannot exceed 1000 characters']
  },
  
  // Media
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      default: null
    },
    duration: {
      type: Number,
      default: null // for videos
    }
  }],
  
  // Engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  
  // Post Settings
  isPublic: {
    type: Boolean,
    default: true
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  
  // Categories/Tags
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  
  // Location
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  
  // Post Type
  postType: {
    type: String,
    enum: ['general', 'career', 'achievement', 'event', 'question'],
    default: 'general'
  },
  
  // Career-related fields (for career posts)
  careerInfo: {
    company: String,
    position: String,
    experience: String,
    skills: [String]
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Virtual for engagement score
postSchema.virtual('engagementScore').get(function() {
  return (this.likes ? this.likes.length : 0) + ((this.comments ? this.comments.length : 0) * 2) + (this.shares || 0);
});

// Indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ isActive: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ postType: 1 });
postSchema.index({ 'careerInfo.company': 1 });
postSchema.index({ likes: 1 });
postSchema.index({ createdAt: -1 });

// Pre-save middleware to clean tags
postSchema.pre('save', function(next) {
  if (this.tags) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }
  next();
});

// Method to add like
postSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(id => !id.equals(userId));
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Method to remove comment
postSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => !comment._id.equals(commentId));
  return this.save();
};

// Method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get trending posts
postSchema.statics.getTrending = function(limit = 10) {
  return this.aggregate([
    { $match: { isActive: true, isPublic: true } },
    { $addFields: { 
      engagementScore: { 
        $add: [
          { $size: '$likes' }, 
          { $multiply: [{ $size: '$comments' }, 2] }, 
          '$shares' 
        ] 
      } 
    }},
    { $sort: { engagementScore: -1, createdAt: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' }},
    { $unwind: '$author' },
    { $project: { 'author.password': 0 } }
  ]);
};

// Static method to get posts by user
postSchema.statics.getByUser = function(userId, limit = 20, skip = 0) {
  return this.find({ author: userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('author', 'name profileImage role')
    .populate('comments.user', 'name profileImage');
};

module.exports = mongoose.model('Post', postSchema); 