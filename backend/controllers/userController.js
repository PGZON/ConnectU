const User = require('../models/User');
const { successResponse, notFoundResponse, badRequestResponse, forbiddenResponse } = require('../utils/responseHandler');
const { uploadImage, deleteFile } = require('../config/cloudinary');
const Connection = require('../models/Connection');
const Post = require('../models/Post');
const Query = require('../models/Query');
const Log = require('../models/Log');

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    if (!user.isActive) {
      return notFoundResponse(res, 'User not found');
    }

    // Count accepted connections (as student or alumni)
    const connectionsCount = await Connection.countDocuments({
      $or: [
        { student: user._id },
        { alumni: user._id }
      ],
      status: 'accepted'
    });
    // Count posts
    const postsCount = await Post.countDocuments({ author: user._id, isActive: true });
    // Count queries (as student)
    const queriesCount = await Query.countDocuments({ student: user._id });
    const userResponse = user.getPublicProfile();
    userResponse.connectionsCount = connectionsCount;
    userResponse.postsCount = postsCount;
    userResponse.queriesCount = queriesCount;
    return successResponse(res, userResponse, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Get user profile error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile/:id
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is updating their own profile or is admin
    if (id !== req.user._id.toString() && req.user.role !== 'admin') {
      return forbiddenResponse(res, 'Not authorized to update this profile');
    }

    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Update allowed fields
    const allowedFields = ['name', 'bio', 'phone', 'location', 'linkedin', 'github', 'preferences'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();
    const userResponse = user.getPublicProfile();
    
    return successResponse(res, userResponse, 'Profile updated successfully');
  } catch (error) {
    console.error('Update user profile error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate role
    if (!['student', 'alumni'].includes(role)) {
      return badRequestResponse(res, 'Invalid role');
    }

    const users = await User.findByRole(role)
      .limit(limit)
      .skip(skip)
      .select('-password');

    const total = await User.countDocuments({ role, isActive: true, isVerified: true });

    const usersResponse = users.map(user => user.getPublicProfile());

    return successResponse(res, {
      users: usersResponse,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get users by role error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q, role, department, limit = 20 } = req.query;

    if (!q) {
      return badRequestResponse(res, 'Search query is required');
    }

    const searchQuery = {
      isActive: true,
      isVerified: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ]
    };

    if (role) {
      searchQuery.role = role;
    }

    if (department) {
      searchQuery.department = department;
    }

    const users = await User.find(searchQuery)
      .limit(parseInt(limit))
      .select('-password');

    const usersResponse = users.map(user => user.getPublicProfile());

    return successResponse(res, usersResponse, 'Search completed successfully');
  } catch (error) {
    console.error('Search users error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    if (req.query.hard === 'true') {
      await User.deleteOne({ _id: req.params.id });
      await Log.create({
        type: 'user_delete',
        actor: req.user.email,
        target: user.email,
        message: `Admin ${req.user.email} permanently deleted user ${user.email} (${user._id})`,
        meta: { userId: user._id }
      });
      return successResponse(res, null, 'User permanently deleted');
    }
    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();
    await Log.create({
      type: 'user_deactivate',
      actor: req.user.email,
      target: user.email,
      message: `Admin ${req.user.email} deactivated user ${user.email} (${user._id})`,
      meta: { userId: user._id }
    });
    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Upload profile image
// @route   POST /api/users/upload/profile-image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return badRequestResponse(res, 'No image file provided');
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path, 'connectu/profile-images');

    // Update user profile
    const user = await User.findById(req.user._id);
    if (user.profileImage) {
      // Delete old image
      await deleteFile(user.profileImage);
    }

    user.profileImage = result.url;
    await user.save();

    return successResponse(res, { profileImage: result.url }, 'Profile image uploaded successfully');
  } catch (error) {
    console.error('Upload profile image error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Upload cover image
// @route   POST /api/users/upload/cover-image
// @access  Private
const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return badRequestResponse(res, 'No image file provided');
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path, 'connectu/cover-images');

    // Update user profile
    const user = await User.findById(req.user._id);
    if (user.coverImage) {
      // Delete old image
      await deleteFile(user.coverImage);
    }

    user.coverImage = result.url;
    await user.save();

    return successResponse(res, { coverImage: result.url }, 'Cover image uploaded successfully');
  } catch (error) {
    console.error('Upload cover image error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get all users
// @route   GET /api/users/all
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const searchFilter = {
      isActive: true,
      isVerified: true,
      _id: { $ne: req.user._id } // Exclude current user
    };

    // Students discover alumni, alumni discover everyone else
    if (req.user.role === 'student') {
      searchFilter.role = 'alumni';
    } 
    // No additional role filter is needed for alumni, they see all other valid users.

    const users = await User.find(searchFilter)
      .limit(limit)
      .skip(skip)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchFilter);

    const usersResponse = users.map(user => user.getPublicProfile());

    return successResponse(res, {
      users: usersResponse,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Users retrieved successfully');

  } catch (error) {
    console.error('Get all users error:', error);
    return badRequestResponse(res, 'Error retrieving users');
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUsersByRole,
  searchUsers,
  deleteUser,
  uploadProfileImage,
  uploadCoverImage,
  getAllUsers,
}; 