const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    type: String,
    description: String
  }]
}, {
  timestamps: true
});

const querySchema = new mongoose.Schema({
  // Student who asked the question
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Question details
  title: {
    type: String,
    required: [true, 'Question title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Question content is required'],
    maxlength: [1000, 'Question content cannot exceed 1000 characters']
  },
  
  // Category and tags
  category: {
    type: String,
    enum: ['career-guidance', 'interview-prep', 'job-search', 'skill-development', 'industry-insights', 'networking', 'resume', 'other'],
    required: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Alumni assignment
  assignedAlumni: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Answers
  answers: [answerSchema],
  
  // Status tracking
  status: {
    type: String,
    enum: ['open', 'assigned', 'answered', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Attachments
  attachments: [{
    type: String,
    description: String
  }],
  
  // Resolution
  resolvedAt: {
    type: Date,
    default: null
  },
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Feedback
  studentFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Feedback comment cannot exceed 500 characters']
    }
  },
  
  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },
  
  reportCount: {
    type: Number,
    default: 0
  },
  
  // Auto-assignment settings
  autoAssign: {
    type: Boolean,
    default: true
  },
  
  // Expiry (for urgent queries)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
querySchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for answer count
querySchema.virtual('answerCount').get(function() {
  return this.answers.length;
});

// Virtual for accepted answer
querySchema.virtual('acceptedAnswer').get(function() {
  return this.answers.find(answer => answer.isAccepted);
});

// Virtual for time since creation
querySchema.virtual('timeSinceCreation').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)} days ago`;
  } else {
    return `${Math.floor(diffInHours / 168)} weeks ago`;
  }
});

// Indexes for better performance
querySchema.index({ student: 1, createdAt: -1 });
querySchema.index({ status: 1, createdAt: -1 });
querySchema.index({ category: 1 });
querySchema.index({ tags: 1 });
querySchema.index({ priority: 1 });
querySchema.index({ assignedAlumni: 1 });
querySchema.index({ 'answers.alumni': 1 });
querySchema.index({ createdAt: -1 });

// Pre-save middleware to clean tags
querySchema.pre('save', function(next) {
  if (this.tags) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags
  }
  next();
});

// Method to assign alumni
querySchema.methods.assignAlumni = function(alumniId) {
  if (!this.assignedAlumni.includes(alumniId)) {
    this.assignedAlumni.push(alumniId);
    this.status = 'assigned';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add answer
querySchema.methods.addAnswer = function(alumniId, content, attachments = []) {
  this.answers.push({
    alumni: alumniId,
    content: content,
    attachments: attachments
  });
  this.status = 'answered';
  return this.save();
};

// Method to accept answer
querySchema.methods.acceptAnswer = function(answerId) {
  // Unaccept all other answers
  this.answers.forEach(answer => {
    answer.isAccepted = false;
  });
  
  // Accept the specified answer
  const answer = this.answers.id(answerId);
  if (answer) {
    answer.isAccepted = true;
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.resolvedBy = answer.alumni;
  }
  
  return this.save();
};

// Method to upvote
querySchema.methods.upvote = function(userId) {
  // Remove from downvotes if exists
  this.downvotes = this.downvotes.filter(id => !id.equals(userId));
  
  // Add to upvotes if not already there
  if (!this.upvotes.includes(userId)) {
    this.upvotes.push(userId);
  }
  
  return this.save();
};

// Method to downvote
querySchema.methods.downvote = function(userId) {
  // Remove from upvotes if exists
  this.upvotes = this.upvotes.filter(id => !id.equals(userId));
  
  // Add to downvotes if not already there
  if (!this.downvotes.includes(userId)) {
    this.downvotes.push(userId);
  }
  
  return this.save();
};

// Static method to get queries by status
querySchema.statics.getByStatus = function(status, limit = 20, skip = 0) {
  return this.find({ status, isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('student', 'name profileImage role')
    .populate('assignedAlumni', 'name profileImage role')
    .populate('answers.alumni', 'name profileImage role');
};

// Static method to get trending queries
querySchema.statics.getTrending = function(limit = 10) {
  return this.aggregate([
    { $match: { isPublic: true, status: { $ne: 'closed' } } },
    { $addFields: { 
      score: { 
        $add: [
          { $size: '$upvotes' }, 
          { $multiply: [{ $size: '$answers' }, 3] },
          { $multiply: ['$views', 0.1] }
        ] 
      } 
    }},
    { $sort: { score: -1, createdAt: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'student' }},
    { $unwind: '$student' },
    { $project: { 'student.password': 0 } }
  ]);
};

module.exports = mongoose.model('Query', querySchema); 