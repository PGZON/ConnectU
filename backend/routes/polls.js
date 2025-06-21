const express = require('express');
const router = express.Router();
const { protect, requireVerification, requireStudent, requireAdmin } = require('../middleware/auth');
const pollController = require('../controllers/pollController');

// Admin: Create poll
router.post('/', protect, requireVerification, requireAdmin, pollController.createPoll);
// Get active poll
router.get('/active', protect, requireVerification, pollController.getActivePoll);
// Student: Vote
router.post('/:id/vote', protect, requireVerification, requireStudent, pollController.votePoll);
// Get poll results
router.get('/:id/results', protect, requireVerification, pollController.getPollResults);

module.exports = router; 