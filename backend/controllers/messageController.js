const Message = require('../models/Message');
const Connection = require('../models/Connection');
const { successResponse, notFoundResponse, badRequestResponse, forbiddenResponse } = require('../utils/responseHandler');

// This function will be called by both the HTTP endpoint and the socket handler
const createAndSendMessage = async (senderId, receiverId, content, type = 'text', attachments = []) => {
  console.log('[Controller] > createAndSendMessage: Starting.');
  console.log(`[Controller] > createAndSendMessage: Sender: ${senderId}, Receiver: ${receiverId}`);

  // Check if users are connected
  const connection = await Connection.areConnected(senderId, receiverId);
  if (!connection) {
    // In a real-time context, we can throw an error or emit an error event
    throw new Error('You can only message connected users');
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
    type,
    attachments,
    status: 'sent'
  });

  if (!message) {
    throw new Error('Message creation failed in database.');
  }
  console.log('[Controller] > createAndSendMessage: ✅  Message saved to DB:', JSON.stringify(message, null, 2));
  
  // Populate to get full user objects for the socket emission
  await message.populate('sender', 'name email role profileImageUrl');
  await message.populate('receiver', 'name email role profileImageUrl');

  if (!message) {
    throw new Error('Could not re-fetch populated message.');
  }
  console.log('[Controller] > createAndSendMessage: ✅  Returning populated message:', JSON.stringify(message, null, 2));

  return message;
};

// @desc    Send message via HTTP
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiver, content, type, attachments } = req.body;
    const message = await createAndSendMessage(req.user._id, receiver, content, type, attachments);
    return successResponse(res, message, 'Message sent successfully');
  } catch (error) {
    console.error('Send message error:', error);
    // Use forbiddenResponse for the specific connection error
    if (error.message === 'You can only message connected users') {
      return forbiddenResponse(res, error.message);
    }
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get conversation with user
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'name email role profileImageUrl')
      .populate('receiver', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Message.countDocuments({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        status: 'sent'
      },
      { status: 'read' }
    );

    return successResponse(res, {
      messages: messages.reverse(),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Conversation retrieved successfully');
  } catch (error) {
    console.error('Get conversation error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get recent conversations
// @route   GET /api/messages/conversations
// @access  Private
const getRecentConversations = async (req, res) => {
  try {
    // Get unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', req.user._id] },
                    { $eq: ['$status', 'sent'] }
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
        $limit: 20
      }
    ]);

    // Populate user details
    const populatedConversations = await Message.populate(conversations, [
      { path: '_id', select: 'name email role profileImageUrl' },
      { path: 'lastMessage.sender', select: 'name email role profileImageUrl' },
      { path: 'lastMessage.receiver', select: 'name email role profileImageUrl' }
    ]);

    return successResponse(res, populatedConversations, 'Recent conversations retrieved successfully');
  } catch (error) {
    console.error('Get recent conversations error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/conversation/:userId/read
// @access  Private
const markConversationAsRead = async (req, res) => {
  try {
    const result = await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        status: 'sent'
      },
      { status: 'read' }
    );

    return successResponse(res, { updatedCount: result.modifiedCount }, 'Messages marked as read');
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return notFoundResponse(res, 'Message not found');
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Not authorized to delete this message');
    }

    await Message.deleteOne({ _id: req.params.id });

    return successResponse(res, null, 'Message deleted successfully');
  } catch (error) {
    console.error('Delete message error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return badRequestResponse(res, 'Search query is required');
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ],
      content: { $regex: q, $options: 'i' }
    })
      .populate('sender', 'name email role profileImageUrl')
      .populate('receiver', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(20);

    return successResponse(res, messages, 'Search completed successfully');
  } catch (error) {
    console.error('Search messages error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get unread messages
// @route   GET /api/messages/unread
// @access  Private
const getUnreadMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      receiver: req.user._id,
      status: 'sent'
    })
      .populate('sender', 'name email role profileImageUrl')
      .populate('receiver', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(res, messages, 'Unread messages retrieved successfully');
  } catch (error) {
    console.error('Get unread messages error:', error);
    return badRequestResponse(res, error.message);
  }
};

module.exports = {
  createAndSendMessage,
  sendMessage,
  getConversation,
  getRecentConversations,
  markConversationAsRead,
  deleteMessage,
  searchMessages,
  getUnreadMessages
}; 