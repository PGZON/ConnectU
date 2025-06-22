const express = require('express');
const router = express.Router();
const { protect, requireVerification, requireOwnership } = require('../middleware/auth');
const { validatePost, validatePagination } = require('../middleware/validate');
const Post = require('../models/Post');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  getTrendingPosts,
  getUserPosts
} = require('../controllers/postController');
const multer = require('multer');

// Update multer config to accept both images and videos
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};
const upload = multer({ storage, fileFilter });

// Public routes (with optional auth)
router.get('/', validatePagination, getPosts);
router.get('/trending', getTrendingPosts);
router.get('/user/:userId', validatePagination, getUserPosts);
router.get('/:id', getPost);

// Protected routes
router.post('/', protect, requireVerification, upload.array('media', 5), createPost);
router.put('/:id', protect, requireVerification, requireOwnership(Post), validatePost, updatePost);
router.delete('/:id', protect, requireVerification, requireOwnership(Post), deletePost);

// Engagement routes
router.post('/:id/like', protect, requireVerification, likePost);
router.delete('/:id/like', protect, requireVerification, unlikePost);
router.post('/:id/comment', protect, requireVerification, addComment);
router.delete('/:id/comment/:commentId', protect, requireVerification, removeComment);

module.exports = router; 