const express = require('express');
const router = express.Router();
const { protect, requireVerification, requireConnection } = require('../middleware/auth');
const { validateMessage, validatePagination } = require('../middleware/validate');
const {
  sendMessage,
  getConversation,
  getRecentConversations,
  markConversationAsRead,
  deleteMessage,
  searchMessages,
  getUnreadMessages
} = require('../controllers/messageController');

// Protected routes
router.post('/send', protect, requireVerification, requireConnection, validateMessage, sendMessage);
router.get('/conversation/:userId', protect, requireVerification, requireConnection, validatePagination, getConversation);
router.get('/conversations', protect, requireVerification, getRecentConversations);
router.put('/conversation/:userId/read', protect, requireVerification, requireConnection, markConversationAsRead);
router.delete('/:id', protect, requireVerification, deleteMessage);
router.get('/search', protect, requireVerification, searchMessages);
router.get('/unread', protect, requireVerification, getUnreadMessages);

module.exports = router; 