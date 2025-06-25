const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Query = require('../models/Query');
const Poll = require('../models/Poll');
const Connection = require('../models/Connection');
const Announcement = require('../models/Announcement');
const Log = require('../models/Log');

// Disable caching for all admin routes
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isActive: true, isVerified: true });
    const totalPosts = await Post.countDocuments();
    const activePosts = await Post.countDocuments({ isActive: true });
    const totalQueries = await Query.countDocuments();
    const activeQueries = await Query.countDocuments({ isActive: true });
    const totalPolls = await Poll.countDocuments();
    const totalAnnouncements = await Announcement.countDocuments();
    const totalAISuggestions = 0; // Placeholder
    // Recent activity: last 10 logs
    const recentActivity = await Log.find().sort({ timestamp: -1 }).limit(10);
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalPosts,
        activePosts,
        totalQueries,
        activeQueries,
        totalPolls,
        totalAnnouncements,
        totalAISuggestions,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats', error: error.message });
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const { role, showInactive } = req.query;
    const filter = {};
    if (role && ['student', 'alumni', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (!showInactive) {
      filter.isActive = true;
    }
    const users = await User.find(filter)
      .select('name email role isActive isVerified verificationStatus createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get users', error: error.message });
  }
});

// @desc    Moderate content
// @route   PUT /api/admin/moderate/:type/:id
// @access  Private/Admin
router.put('/moderate/:type/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { action, reason } = req.body;

    // This would handle content moderation
    res.status(200).json({
      success: true,
      message: `Content ${action} successfully`,
      data: { type, id, action, reason }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Moderation failed',
      error: error.message
    });
  }
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, requireAdmin, async (req, res) => {
  try {
    // This would provide system analytics
    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: {
        userGrowth: [],
        engagementMetrics: {},
        popularContent: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

// Verifications
router.get('/verifications', protect, requireAdmin, async (req, res) => {
  try {
    const pending = await User.find({ verificationStatus: 'pending' })
      .select('name email role createdAt');
    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get verifications', error: error.message });
  }
});

// Approve/Reject verification
router.post('/verifications/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body; // action: 'approve' | 'reject'
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (action === 'approve') {
      user.verificationStatus = 'verified';
      user.isVerified = true;
    } else if (action === 'reject') {
      user.verificationStatus = 'rejected';
      user.isVerified = false;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
    // Optionally store note somewhere (e.g., user.notes or a log)
    await user.save();
    res.status(200).json({ success: true, message: `User ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update verification', error: error.message });
  }
});

// Queries
router.get('/queries', protect, requireAdmin, async (req, res) => {
  try {
    const queries = await Query.find()
      .select('title status createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get queries', error: error.message });
  }
});

// Delete query
router.delete('/queries/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const query = await Query.findByIdAndDelete(id);
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    res.status(200).json({ success: true, message: 'Query deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete query', error: error.message });
  }
});

// Mark query as abusive
router.put('/queries/:id/abusive', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const query = await Query.findById(id);
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    query.isReported = true;
    query.reportCount = (query.reportCount || 0) + 1;
    await query.save();
    res.status(200).json({ success: true, message: 'Query marked as abusive' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark query as abusive', error: error.message });
  }
});

// Posts
router.get('/posts', protect, requireAdmin, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name')
      .select('caption author createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get posts', error: error.message });
  }
});

// Delete post
router.delete('/posts/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
});

// Edit post caption
router.put('/posts/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.caption = caption;
    await post.save();
    res.status(200).json({ success: true, message: 'Post updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
  }
});

// Polls
router.get('/polls', protect, requireAdmin, async (req, res) => {
  try {
    const polls = await Poll.find()
      .select('question deadline votes options createdAt')
      .sort({ createdAt: -1 });
    const data = polls.map(p => ({
      _id: p._id,
      question: p.question,
      deadline: p.deadline,
      participationCount: p.votes ? p.votes.length : 0,
      options: p.options
    }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get polls', error: error.message });
  }
});

// Create poll
router.post('/polls', protect, requireAdmin, async (req, res) => {
  try {
    const { question, options, deadline } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Poll must have a question and at least 2 options' });
    }
    if (!deadline || isNaN(Date.parse(deadline))) {
      return res.status(400).json({ success: false, message: 'Invalid deadline' });
    }
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text })),
      deadline,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create poll', error: error.message });
  }
});

// Announcements
router.get('/announcements', protect, requireAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .select('message createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get announcements', error: error.message });
  }
});

// Create announcement
router.post('/announcements', protect, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.length < 3) {
      return res.status(400).json({ success: false, message: 'Announcement message is too short' });
    }
    const announcement = await Announcement.create({ message });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create announcement', error: error.message });
  }
});

// Admin logs endpoint
router.get('/logs', protect, requireAdmin, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(200);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs', error: error.message });
  }
});

// AI Manager
router.get('/ai-queries', protect, requireAdmin, async (req, res) => {
  try {
    const queries = await Query.find()
      .select('title _id')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get AI queries', error: error.message });
  }
});

// Trigger AI suggestion (stub)
router.post('/ai-queries/:id/trigger', protect, requireAdmin, async (req, res) => {
  // TODO: Implement AI suggestion trigger logic
  res.status(200).json({ success: true, message: 'AI suggestion triggered (stub)' });
});

module.exports = router; 