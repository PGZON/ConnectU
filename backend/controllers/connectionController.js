const Connection = require('../models/Connection');
const User = require('../models/User');
const { successResponse, notFoundResponse, badRequestResponse, forbiddenResponse } = require('../utils/responseHandler');

// @desc    Send connection request
// @route   POST /api/connections/request
// @access  Private/Student
const sendConnectionRequest = async (req, res) => {
  try {
    const { alumniId, message, connectionType } = req.body;

    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== 'alumni' || !alumni.isVerified) {
      return notFoundResponse(res, 'Alumni not found or not verified');
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { student: req.user._id, alumni: alumniId },
        { student: alumniId, alumni: req.user._id }
      ]
    });

    if (existingConnection) {
      return badRequestResponse(res, 'Connection request already exists');
    }

    const connection = await Connection.create({
      student: req.user._id,
      alumni: alumniId,
      message: message || '',
      connectionType: connectionType || 'general',
      status: 'pending'
    });

    await connection.populate('student', 'name email role profileImageUrl');
    await connection.populate('alumni', 'name email role profileImageUrl');

    return successResponse(res, connection, 'Connection request sent successfully');
  } catch (error) {
    console.error('Send connection request error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Accept connection request
// @route   PUT /api/connections/:id/accept
// @access  Private/Alumni
const acceptConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return notFoundResponse(res, 'Connection request not found');
    }

    if (connection.alumni.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Not authorized to accept this connection');
    }

    connection.status = 'accepted';
    connection.responseMessage = req.body.responseMessage || '';
    connection.respondedAt = new Date();
    await connection.save();

    return successResponse(res, connection, 'Connection accepted successfully');
  } catch (error) {
    console.error('Accept connection error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Reject connection request
// @route   PUT /api/connections/:id/reject
// @access  Private/Alumni
const rejectConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return notFoundResponse(res, 'Connection request not found');
    }

    if (connection.alumni.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Not authorized to reject this connection');
    }

    connection.status = 'rejected';
    connection.responseMessage = req.body.responseMessage || '';
    connection.respondedAt = new Date();
    await connection.save();

    return successResponse(res, connection, 'Connection rejected successfully');
  } catch (error) {
    console.error('Reject connection error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get user connections
// @route   GET /api/connections/user/:userId
// @access  Private
const getConnections = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const connections = await Connection.find({
      $or: [
        { student: req.params.userId },
        { alumni: req.params.userId }
      ],
      status: 'accepted'
    })
      .populate('student', 'name email role profileImageUrl')
      .populate('alumni', 'name email role profileImageUrl')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Connection.countDocuments({
      $or: [
        { student: req.params.userId },
        { alumni: req.params.userId }
      ],
      status: 'accepted'
    });

    return successResponse(res, {
      connections,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Connections retrieved successfully');
  } catch (error) {
    console.error('Get connections error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get pending requests
// @route   GET /api/connections/pending
// @access  Private/Alumni
const getPendingRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const connections = await Connection.find({
      alumni: req.user._id,
      status: 'pending'
    })
      .populate('student', 'name email role profileImageUrl')
      .populate('alumni', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Connection.countDocuments({
      alumni: req.user._id,
      status: 'pending'
    });

    return successResponse(res, {
      connections,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Pending requests retrieved successfully');
  } catch (error) {
    console.error('Get pending requests error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get connection suggestions
// @route   GET /api/connections/suggestions
// @access  Private/Student
const getConnectionSuggestions = async (req, res) => {
  try {
    const existingConnections = await Connection.find({
      student: req.user._id
    }).select('alumni');

    const connectedAlumniIds = existingConnections.map(conn => conn.alumni);

    const suggestions = await User.find({
      _id: { $nin: connectedAlumniIds },
      role: 'alumni',
      isVerified: true,
      isActive: true
    })
      .select('name email role profileImageUrl department currentCompany designation')
      .limit(10);

    return successResponse(res, suggestions, 'Connection suggestions retrieved successfully');
  } catch (error) {
    console.error('Get connection suggestions error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Block connection
// @route   PUT /api/connections/:id/block
// @access  Private
const blockConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return notFoundResponse(res, 'Connection not found');
    }

    connection.status = 'blocked';
    connection.blockedBy = req.user._id;
    await connection.save();

    return successResponse(res, connection, 'Connection blocked successfully');
  } catch (error) {
    console.error('Block connection error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Update connection strength
// @route   PUT /api/connections/:id/strength
// @access  Private
const updateConnectionStrength = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return notFoundResponse(res, 'Connection not found');
    }

    connection.strength = req.body.strength || connection.strength;
    await connection.save();

    return successResponse(res, connection, 'Connection strength updated successfully');
  } catch (error) {
    console.error('Update connection strength error:', error);
    return badRequestResponse(res, error.message);
  }
};

module.exports = {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getConnections,
  getPendingRequests,
  getConnectionSuggestions,
  blockConnection,
  updateConnectionStrength
}; 