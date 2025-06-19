const express = require('express');
const router = express.Router();
const { protect, requireVerification } = require('../middleware/auth');
const PreapprovedStudent = require('../models/PreapprovedStudent');
const User = require('../models/User');

// @desc    Verify PRN (Student verification)
// @route   POST /api/verify/prn
// @access  Public
router.post('/prn', async (req, res) => {
  try {
    const { prn } = req.body;
    if (!prn) {
      return res.status(400).json({ success: false, message: 'PRN is required' });
    }
    // Check if PRN exists in PreapprovedStudent
    const preapproved = await PreapprovedStudent.findOne({ prn });
    if (!preapproved) {
      return res.status(404).json({ success: false, message: 'PRN not found in preapproved list' });
    }
    res.status(200).json({
      success: true,
      message: 'PRN verified successfully',
      data: {
        verified: true,
        studentInfo: {
          name: preapproved.name,
          prn: preapproved.prn,
          department: preapproved.branch,
          batch: preapproved.graduationYear
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// @desc    Verify alumni credentials
// @route   POST /api/verify/alumni
// @access  Private
router.post('/alumni', protect, async (req, res) => {
  try {
    // This would integrate with alumni verification system
    // For now, we'll return a mock response
    res.status(200).json({
      success: true,
      message: 'Alumni verification endpoint - integrate with verification system',
      data: {
        verified: true,
        alumniInfo: {
          name: req.body.name,
          graduationYear: req.body.graduationYear,
          department: req.body.department
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

module.exports = router; 