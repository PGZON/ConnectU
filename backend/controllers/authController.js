const User = require('../models/User');
const { generateTokenPair, generateToken, generateRefreshToken } = require('../utils/jwtUtils');
const { successResponse, createdResponse, badRequestResponse, unauthorizedResponse, conflictResponse } = require('../utils/responseHandler');
const PreapprovedStudent = require('../models/PreapprovedStudent');
const PreApproveAlumni = require('../models/preApproveAlumni');
const crypto = require('crypto');
const Log = require('../models/Log');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, role, prn, batch, department, graduationYear, currentCompany, designation, experience } = req.body;

    console.log('Signup request body:', req.body);
    console.log('Role:', role);
    console.log('Student fields:', { prn, batch, department });
    console.log('Alumni fields:', { graduationYear, currentCompany, designation, experience });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictResponse(res, 'User with this email already exists');
    }

    // Student signup: check preapproved PRN
    let userData = { name, email, password, role };
    if (role === 'student') {
      // Remove preapproved PRN check
      userData.name = name;
      userData.prn = prn;
      userData.batch = batch;
      userData.department = department;
    } else if (role === 'alumni') {
      userData.graduationYear = graduationYear;
      userData.currentCompany = currentCompany;
      userData.designation = designation;
      userData.experience = experience;
    }

    console.log('Final user data to create:', userData);

    // Create user
    const user = await User.create(userData);

    // Generate tokens
    const tokens = generateTokenPair(user._id);

    // Remove password from response
    const userResponse = user.getPublicProfile();

    return createdResponse(res, {
      user: userResponse,
      ...tokens
    }, 'User registered successfully');
  } catch (error) {
    console.error('Signup error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);

    // Input validation
    if (!email || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and include password
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    // Log user lookup result (without sensitive data)
    console.log('User lookup result:', {
      email,
      found: !!user,
      hasPassword: !!user?.password,
      isActive: user?.isActive,
      role: user?.role,
      isVerified: user?.isVerified,
      verificationStatus: user?.verificationStatus
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // In login controller, before password check:
    console.log('Input password raw:', `"${password}"`, 'length:', password.length);
    console.log('Stored hash raw:', `"${user.password}"`, 'length:', user.password ? user.password.length : 'undefined', 'startsWith $2a$12$:', user.password ? user.password.startsWith('$2a$12$') : false);

    // Check password
    const isMatch = await user.comparePassword(password);
    
    console.log('Password verification result:', {
      email,
      isMatch,
      passwordHash: user.password.substring(0, 7) + '...'
    });

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Fix inconsistent verification status
    if (user.isVerified && user.verificationStatus === 'pending') {
      user.verificationStatus = 'verified';
      await user.save();
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last active time
    user.lastActive = new Date();
    await user.save();

    // Get user response data
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl || null,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      department: user.department,
      batch: user.batch,
      prn: user.prn,
      graduationYear: user.graduationYear,
      currentCompany: user.currentCompany,
      designation: user.designation
    };

    console.log('Login successful:', {
      email,
      userId: user._id,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus
    });

    // Log login
    await Log.create({
      type: 'login',
      actor: user.email,
      message: `User ${user.email} logged in`,
      meta: { userId: user._id }
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    const userResponse = user.getPublicProfile();
    return successResponse(res, userResponse, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Get me error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return badRequestResponse(res, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return unauthorizedResponse(res, 'Invalid refresh token');
    }

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return unauthorizedResponse(res, 'User not found or inactive');
    }

    // Generate new token pair
    const tokens = generateTokenPair(user._id);

    return successResponse(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    console.error('Refresh token error:', error);
    return unauthorizedResponse(res, 'Invalid refresh token');
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Update last active
    await User.findByIdAndUpdate(req.user._id, {
      lastActive: new Date()
    });

    // Log logout
    await Log.create({
      type: 'logout',
      actor: req.user.email,
      message: `User ${req.user.email} logged out`,
      meta: { userId: req.user._id }
    });

    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return badRequestResponse(res, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return badRequestResponse(res, 'Email is required');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return badRequestResponse(res, 'No user found with that email');
    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 1000 * 60 * 30; // 30 min
    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();
    // In production, send email. For now, log the reset link:
    const resetLink = `https://your-frontend-url/reset-password?token=${resetToken}`;
    console.log('Password reset link:', resetLink);
    return successResponse(res, null, 'Password reset link sent to email (check console in dev)');
  } catch (error) {
    console.error('Forgot password error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return badRequestResponse(res, 'Token and new password are required');
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) return badRequestResponse(res, 'Invalid or expired reset token');
    user.password = newPassword; // pre-save hook will hash
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Register student
// @route   POST /api/auth/student/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { name, prn, email, password, department, batch } = req.body;
    if (!name || !prn || !email || !password) {
      return badRequestResponse(res, 'All fields are required');
    }
    // Check if PRN exists in preapprovedstudents
    const preapproved = await PreapprovedStudent.findOne({ prn: prn.trim() });
    if (!preapproved) {
      return badRequestResponse(res, 'Invalid PRN');
    }
    // Check if name matches (case/whitespace-insensitive)
    const normalize = s => s.replace(/\s+/g, '').toLowerCase();
    if (normalize(preapproved.name) !== normalize(name)) {
      return badRequestResponse(res, 'PRN and name do not match');
    }
    // Check if PRN is already used
    const prnUsed = await User.findOne({ prn: prn.trim() });
    if (prnUsed) {
      return badRequestResponse(res, 'This PRN is already registered');
    }
    // Check if email is already used
    const emailUsed = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailUsed) {
      return badRequestResponse(res, 'Email is already in use');
    }
    // Use department and batch from request or preapproved
    const studentDepartment = department || preapproved.branch;
    const studentBatch = batch || preapproved.graduationYear;
    if (!studentDepartment || !studentBatch) {
      return badRequestResponse(res, 'Department and batch are required');
    }
    // Create user
    const user = await User.create({
      name: preapproved.name, // use canonical name
      email: email.trim().toLowerCase(),
      password,
      prn: prn.trim(),
      role: 'student',
      isVerified: true,
      profileImage: '',
      bio: '',
      department: studentDepartment,
      batch: studentBatch
    });
    // Generate JWT
    const tokens = generateTokenPair(user._id);
    const userResponse = user.getPublicProfile();
    return createdResponse(res, { user: userResponse, ...tokens }, 'Student registered successfully');
  } catch (error) {
    return badRequestResponse(res, error.message);
  }
};

// @desc    Register alumni
// @route   POST /api/auth/alumni/register
// @access  Public
const registerAlumni = async (req, res) => {
  try {
    const { name, alumniId, email, password } = req.body;
    if (!name || !alumniId || !email || !password) {
      return badRequestResponse(res, 'All fields are required');
    }
    // Check if alumniId exists in preApproveAlumni
    const preapproved = await PreApproveAlumni.findOne({ alumniId: alumniId.trim() });
    if (!preapproved) {
      return badRequestResponse(res, 'Invalid Alumni ID');
    }
    // Check if name matches (case/whitespace-insensitive)
    const normalize = s => s.replace(/\s+/g, '').toLowerCase();
    if (normalize(preapproved.name) !== normalize(name)) {
      return badRequestResponse(res, 'Alumni ID and name do not match');
    }
    // Check if alumniId is already used
    const alumniIdUsed = await User.findOne({ alumniId: alumniId.trim() });
    if (alumniIdUsed) {
      return badRequestResponse(res, 'This Alumni ID is already registered');
    }
    // Check if email is already used
    const emailUsed = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailUsed) {
      return badRequestResponse(res, 'Email is already in use');
    }
    // Create user
    const user = await User.create({
      name: preapproved.name, // use canonical name
      email: email.trim().toLowerCase(),
      password,
      alumniId: alumniId.trim(),
      role: 'alumni',
      isVerified: true,
      profileImage: '',
      bio: ''
    });
    // Generate JWT
    const tokens = generateTokenPair(user._id);
    const userResponse = user.getPublicProfile();
    return createdResponse(res, { user: userResponse, ...tokens }, 'Alumni registered successfully');
  } catch (error) {
    return badRequestResponse(res, error.message);
  }
};

// NOTE: If users were registered before this fix, their passwords may be double-hashed. Reset those users' passwords in the database.

module.exports = {
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
}; 