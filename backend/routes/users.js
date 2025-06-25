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
const User = require('../models/User');

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

router.put('/:id/activate', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = true;
    await user.save();
    res.status(200).json({ success: true, message: 'User activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate user', error: error.message });
  }
});

module.exports = router; 