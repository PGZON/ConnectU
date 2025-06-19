const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const {
  signup,
  login,
  getMe,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  registerStudent,
  registerAlumni
} = require('../controllers/authController');
const User = require('../models/User');

// Debug route - REMOVE IN PRODUCTION
router.get('/debug/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        debug: { email }
      });
    }

    // Don't send the actual password hash in production!
    return res.json({
      success: true,
      debug: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
        isHashedPassword: user.password?.startsWith('$2'),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Debug route - REMOVE IN PRODUCTION
router.post('/debug/reset-password/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set new password
    user.password = password;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful',
      debug: {
        email: user.email,
        passwordHashed: user.password.startsWith('$2')
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Public routes
router.post('/signup', validateRegistration, signup);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

// Student and Alumni registration
router.post('/student/register', registerStudent);
router.post('/alumni/register', registerAlumni);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router; 