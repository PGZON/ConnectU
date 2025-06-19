const express = require('express');
const router = express.Router();
const { protect, requireVerification, requireAdmin } = require('../middleware/auth');
const { validateProfileUpdate, validatePagination } = require('../middleware/validate');
const {
  getUserProfile,
  updateUserProfile,
  getUsersByRole,
  searchUsers,
  deleteUser,
  uploadProfileImage,
  uploadCoverImage
} = require('../controllers/userController');

// Protected routes
router.get('/profile/:id', protect, getUserProfile);
router.put('/profile/:id', protect, requireVerification, validateProfileUpdate, updateUserProfile);
router.get('/role/:role', protect, validatePagination, getUsersByRole);
router.get('/search', protect, searchUsers);
router.post('/upload/profile-image', protect, uploadProfileImage);
router.post('/upload/cover-image', protect, uploadCoverImage);

// Admin routes
router.delete('/:id', protect, requireAdmin, deleteUser);

module.exports = router; 