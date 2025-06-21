const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Sender of the message
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Receiver of the message
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    trim: true
  },
  
  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'audio', 'location'],
    default: 'text'
  },
  
  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'file', 'audio'],
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
    filename: String,
    size: Number,
    duration: Number, // for audio/video
    thumbnail: String // for video/image
  }],
  
  // Location data (for location messages)
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read status
  readAt: {
    type: Date,
    default: null
  },
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Forwarded message
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    }
  }],
  
  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    editHistory: [{
      content: String,
      editedAt: Date
    }],
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  
  // Encryption (for future implementation)
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Scheduled message
  scheduledFor: {
    type: Date,
    default: null
  },
  
  // Message tags
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for conversation ID (unique identifier for a conversation between two users)
messageSchema.virtual('conversationId').get(function() {
  const users = [this.sender.toString(), this.receiver.toString()].sort();
  return `${users[0]}-${users[1]}`;
});

// Virtual for is media message
messageSchema.virtual('isMediaMessage').get(function() {
  return this.type !== 'text' || (this.attachments && this.attachments.length > 0);
});

// Virtual for is edited
messageSchema.virtual('isEdited').get(function() {
  return this.metadata.isEdited;
});

// Virtual for is deleted
messageSchema.virtual('isDeleted').get(function() {
  return this.metadata.isDeleted;
});

// Indexes for better performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ readAt: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ scheduledFor: 1 });
messageSchema.index({ 'metadata.isDeleted': 1 });

// Compound index for conversation queries
messageSchema.index({ 
  sender: 1, 
  receiver: 1, 
  'metadata.isDeleted': 1, 
  createdAt: -1 
});

// Pre-save middleware to clean tags
messageSchema.pre('save', function(next) {
  if (this.tags) {
    this.tags = this.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags
  }
  next();
});

// Populate sender and receiver details automatically
messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'name profileImage role',
  }).populate({
    path: 'receiver',
    select: 'name profileImage role',
  });
  next();
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => !reaction.user.equals(userId));
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji: emoji });
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => !reaction.user.equals(userId));
  return this.save();
};

// Method to edit message
messageSchema.methods.edit = function(newContent) {
  // Store edit history
  this.metadata.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  
  this.content = newContent;
  this.metadata.isEdited = true;
  this.metadata.editedAt = new Date();
  
  return this.save();
};

// Method to delete message
messageSchema.methods.deleteMessage = function(deletedBy) {
  this.metadata.isDeleted = true;
  this.metadata.deletedAt = new Date();
  this.metadata.deletedBy = deletedBy;
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ],
    'metadata.isDeleted': false
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sender', 'name profileImage role')
    .populate('receiver', 'name profileImage role')
    .populate('replyTo', 'content sender')
    .populate('forwardedFrom', 'content sender');
};

// Static method to get unread messages for a user
messageSchema.statics.getUnreadMessages = function(userId) {
  return this.find({
    receiver: userId,
    status: { $ne: 'read' },
    'metadata.isDeleted': false
  })
    .populate('sender', 'name profileImage role')
    .sort({ createdAt: -1 });
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(user1Id, user2Id) {
  return this.updateMany(
    {
      sender: user2Id,
      receiver: user1Id,
      status: { $ne: 'read' },
      'metadata.isDeleted': false
    },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

// Static method to get recent conversations for a user
messageSchema.statics.getRecentConversations = function(userId, limit = 20) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ],
        'metadata.isDeleted': false
      }
    },
    {
      $addFields: {
        otherUser: {
          $cond: {
            if: { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
            then: '$receiver',
            else: '$sender'
          }
        }
      }
    },
    {
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] },
                  { $ne: ['$status', 'read'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $project: {
        'otherUser.password': 0,
        'lastMessage.sender.password': 0,
        'lastMessage.receiver.password': 0
      }
    }
  ]);
};

// Static method to search messages
messageSchema.statics.searchMessages = function(userId, query, limit = 20) {
  return this.find({
    $or: [
      { sender: userId },
      { receiver: userId }
    ],
    content: { $regex: query, $options: 'i' },
    'metadata.isDeleted': false
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name profileImage role')
    .populate('receiver', 'name profileImage role');
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 