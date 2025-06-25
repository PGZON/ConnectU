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
  uploadCoverImage,
  getAllUsers
} = require('../controllers/userController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};
const upload = multer({ storage, fileFilter });

// Protected routes
router.get('/profile/:id', protect, getUserProfile);
router.put('/profile/:id', protect, requireVerification, validateProfileUpdate, updateUserProfile);
router.get('/role/:role', protect, validatePagination, getUsersByRole);
router.get('/search', protect, searchUsers);
router.post('/upload/profile-image', protect, upload.single('file'), uploadProfileImage);

// Restore protect middleware now that the root cause is being fixed in the client
router.post('/upload/cover-image', protect, upload.single('file'), uploadCoverImage);

router.get('/all', protect, getAllUsers);

// Admin routes
router.delete('/:id', protect, requireAdmin, deleteUser);

module.exports = router; 