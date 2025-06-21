const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  // Student who sent the request
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Alumni who received the request
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Request details
  message: {
    type: String,
    maxlength: [500, 'Connection message cannot exceed 500 characters']
  },
  
  // Status of the connection
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  
  // Timestamps for status changes
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  respondedAt: {
    type: Date,
    default: null
  },
  
  // Alumni's response message
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  
  // Connection strength/type
  connectionType: {
    type: String,
    enum: ['mentor', 'network', 'career-guidance', 'general'],
    default: 'general'
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  
  // Mutual interests/skills
  mutualInterests: [{
    type: String,
    trim: true
  }],
  
  // Connection strength (1-5 stars)
  strength: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  
  // Interaction frequency
  lastInteraction: {
    type: Date,
    default: null
  },
  
  interactionCount: {
    type: Number,
    default: 0
  },
  
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Blocking functionality
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  blockedAt: {
    type: Date,
    default: null
  },
  
  // Notes (for alumni to keep track)
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Reminder settings
  reminderEnabled: {
    type: Boolean,
    default: false
  },
  
  nextReminder: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for connection duration
connectionSchema.virtual('duration').get(function() {
  if (this.status === 'accepted') {
    const now = new Date();
    const accepted = this.respondedAt || this.updatedAt;
    const diffInDays = Math.floor((now - accepted) / (1000 * 60 * 60 * 24));
    return diffInDays;
  }
  return 0;
});

// Virtual for is recent connection
connectionSchema.virtual('isRecent').get(function() {
  if (this.status === 'accepted') {
    const now = new Date();
    const accepted = this.respondedAt || this.updatedAt;
    const diffInDays = Math.floor((now - accepted) / (1000 * 60 * 60 * 24));
    return diffInDays <= 30; // Recent if within 30 days
  }
  return false;
});

// Indexes for better performance
connectionSchema.index({ student: 1, alumni: 1 }, { unique: true });
connectionSchema.index({ student: 1, status: 1 });
connectionSchema.index({ alumni: 1, status: 1 });
connectionSchema.index({ status: 1, requestedAt: -1 });
connectionSchema.index({ connectionType: 1 });
connectionSchema.index({ tags: 1 });
connectionSchema.index({ lastInteraction: -1 });
connectionSchema.index({ strength: -1 });

// Pre-save middleware to clean tags
connectionSchema.pre('save', function(next) {
  if (this.tags) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags
  }
  
  if (this.mutualInterests) {
    this.mutualInterests = this.mutualInterests
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0)
      .slice(0, 10); // Limit to 10 interests
  }
  
  next();
});

// Method to accept connection
connectionSchema.methods.accept = function(responseMessage = '') {
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  return this.save();
};

// Method to reject connection
connectionSchema.methods.reject = function(responseMessage = '') {
  this.status = 'rejected';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  return this.save();
};

// Method to block connection
connectionSchema.methods.block = function(blockedBy, reason = '') {
  this.status = 'blocked';
  this.blockedBy = blockedBy;
  this.blockedAt = new Date();
  this.responseMessage = reason;
  return this.save();
};

// Method to update interaction
connectionSchema.methods.updateInteraction = function() {
  this.lastInteraction = new Date();
  this.interactionCount += 1;
  return this.save();
};

// Method to update strength
connectionSchema.methods.updateStrength = function(strength) {
  if (strength >= 1 && strength <= 5) {
    this.strength = strength;
    return this.save();
  }
  return Promise.reject(new Error('Strength must be between 1 and 5'));
};

// Static method to get connections for a user
connectionSchema.statics.getUserConnections = async function(userId, status = 'accepted', page = 1, limit = 20) {
  if (!userId) {
    console.log('getUserConnections: Missing user ID', { userId });
    return { connections: [], total: 0 };
  }

  try {
    const skip = (page - 1) * limit;
    
    const query = {
      $or: [{ student: userId }, { alumni: userId }],
      ...(status !== 'all' && { status })
    };

    console.log('--- Executing Mongoose Query in getUserConnections ---');
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const rawConnections = await this.find(query).lean();
    console.log(`Raw connection count from DB: ${rawConnections.length}`);
    console.log('Raw connections:', JSON.stringify(rawConnections, null, 2));
    console.log('----------------------------------------------------');

    const [connections, total] = await Promise.all([
      this.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student') // Populate full student object
        .populate('alumni'),  // Populate full alumni object
      this.countDocuments(query)
    ]);

    // Manually construct the response to ensure consistency using getPublicProfile
    const sanitizedConnections = connections.map(conn => {
      return {
        ...conn.toObject(), // Get a plain object representation of the connection
        student: conn.student ? conn.student.getPublicProfile() : null,
        alumni: conn.alumni ? conn.alumni.getPublicProfile() : null,
      };
    });

    return { connections: sanitizedConnections, total };
  } catch (error) {
    console.error('Error getting user connections:', error);
    return { connections: [], total: 0 };
  }
};

// Static method to get pending requests for alumni
connectionSchema.statics.getPendingRequests = function(alumniId, limit = 20, skip = 0) {
  return this.find({
    alumni: alumniId,
    status: 'pending'
  })
    .sort({ requestedAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('student', 'name profileImage role department batch bio');
};

// Static method to get connection suggestions for student
connectionSchema.statics.getSuggestions = function(studentId, limit = 10) {
  return this.aggregate([
    // Get student's existing connections
    { $match: { student: mongoose.Types.ObjectId(studentId), status: 'accepted' } },
    { $group: { _id: null, connectedAlumni: { $push: '$alumni' } } },
    { $project: { connectedAlumni: 1 } }
  ]).then(results => {
    const connectedAlumni = results[0]?.connectedAlumni || [];
    
    // Find alumni not connected to this student
    return mongoose.model('User').aggregate([
      { $match: { 
        role: 'alumni', 
        isVerified: true, 
        isActive: true,
        _id: { $nin: connectedAlumni }
      }},
      { $sample: { size: limit } },
      { $project: { 
        name: 1, 
        profileImage: 1, 
        currentCompany: 1, 
        designation: 1, 
        experience: 1,
        bio: 1,
        department: 1,
        graduationYear: 1
      }}
    ]);
  });
};

// Static method to check if two users are connected
connectionSchema.statics.areConnected = async function(userId1, userId2) {
  if (!userId1 || !userId2) {
    console.log('areConnected: Missing user IDs', { userId1, userId2 });
    return false;
  }

  try {
    const connection = await this.findOne({
      $or: [
        { student: userId1, alumni: userId2 },
        { student: userId2, alumni: userId1 }
      ],
      status: 'accepted'
    });

    return !!connection;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
};

// Static method to get connection between users
connectionSchema.statics.getConnection = async function(userId1, userId2) {
  if (!userId1 || !userId2) {
    console.log('getConnection: Missing user IDs', { userId1, userId2 });
    return null;
  }

  try {
    return await this.findOne({
      $or: [
        { student: userId1, alumni: userId2 },
        { student: userId2, alumni: userId1 }
      ]
    }).populate('student alumni', 'name email role profileImageUrl');
  } catch (error) {
    console.error('Error getting connection:', error);
    return null;
  }
};

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection; 