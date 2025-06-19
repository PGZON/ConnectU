const express = require('express');
const router = express.Router();
const { protect, requireVerification, requireStudent, requireAlumni } = require('../middleware/auth');
const { validateQuery, validatePagination } = require('../middleware/validate');
const {
  createQuery,
  getQueries,
  getQuery,
  updateQuery,
  deleteQuery,
  addAnswer,
  acceptAnswer,
  upvoteQuery,
  downvoteQuery,
  getStudentQueries,
  getAlumniQueries,
  getTrendingQueries
} = require('../controllers/queryController');

// Public routes
router.get('/', validatePagination, getQueries);
router.get('/trending', getTrendingQueries);
router.get('/:id', getQuery);

// Student routes
router.post('/', protect, requireVerification, requireStudent, validateQuery, createQuery);
router.get('/student/:studentId', validatePagination, getStudentQueries);
router.delete('/:id', protect, requireVerification, requireStudent, deleteQuery);

// Alumni routes
router.put('/:id/answer', protect, requireVerification, requireAlumni, addAnswer);
router.put('/:id/accept-answer/:answerId', protect, requireVerification, requireStudent, acceptAnswer);
router.get('/alumni/:alumniId', validatePagination, getAlumniQueries);

// Engagement routes
router.post('/:id/upvote', protect, requireVerification, upvoteQuery);
router.post('/:id/downvote', protect, requireVerification, downvoteQuery);

module.exports = router; 