const express = require('express');
const router = express.Router();
const { protect, requireVerification, requireStudent, requireAlumni } = require('../middleware/auth');
const { validateConnectionRequest, validatePagination } = require('../middleware/validate');
const {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getConnections,
  getPendingRequests,
  getConnectionSuggestions,
  blockConnection,
  updateConnectionStrength
} = require('../controllers/connectionController');

// Protected routes
router.post('/request', protect, requireVerification, requireStudent, validateConnectionRequest, sendConnectionRequest);
router.put('/:id/accept', protect, requireVerification, requireAlumni, acceptConnection);
router.put('/:id/reject', protect, requireVerification, requireAlumni, rejectConnection);
router.get('/user/:userId', protect, validatePagination, getConnections);
router.get('/pending', protect, requireVerification, requireAlumni, validatePagination, getPendingRequests);
router.get('/suggestions', protect, requireVerification, requireStudent, getConnectionSuggestions);
router.put('/:id/block', protect, requireVerification, blockConnection);
router.put('/:id/strength', protect, requireVerification, updateConnectionStrength);

module.exports = router; 