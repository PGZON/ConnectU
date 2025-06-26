const Connection = require('../models/Connection');
const User = require('../models/User');
const mongoose = require('mongoose');
const { successResponse, notFoundResponse, badRequestResponse, forbiddenResponse } = require('../utils/responseHandler');
const { validateRequest } = require('../middleware/validate');
const { body } = require('express-validator');
const Log = require('../models/Log');

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

    const existingActiveConnection = await Connection.findOne({
      $or: [
        { student: req.user._id, alumni: alumniId },
        { student: alumniId, alumni: req.user._id }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingActiveConnection) {
      return badRequestResponse(res, `An active connection or pending request already exists.`);
    }

    await Connection.deleteMany({
      $or: [
        { student: req.user._id, alumni: alumniId },
        { student: alumniId, alumni: req.user._id }
      ],
      status: { $nin: ['pending', 'accepted'] }
    });

    const connection = await Connection.create({
      student: req.user._id,
      alumni: alumniId,
      message: message || '',
      connectionType: connectionType || 'general',
      status: 'pending'
    });

    await connection.populate('student', 'name email role profileImageUrl _id');
    await connection.populate('alumni', 'name email role profileImageUrl _id');

    // Log connection request
    await Log.create({
      type: 'connection_request',
      actor: req.user.email,
      target: alumni.email,
      message: `User ${req.user.email} sent a connection request to ${alumni.email}`,
      meta: { connectionId: connection._id }
    });

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

    // Log connection accept
    await Log.create({
      type: 'connection_accept',
      actor: req.user.email,
      target: connection.student.toString(),
      message: `Alumni ${req.user.email} accepted a connection request`,
      meta: { connectionId: connection._id }
    });

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

    // Log connection reject
    await Log.create({
      type: 'connection_reject',
      actor: req.user.email,
      target: connection.student.toString(),
      message: `Alumni ${req.user.email} rejected a connection request`,
      meta: { connectionId: connection._id }
    });

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
    const limit = parseInt(req.query.limit) || 100;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    console.log(`--- Fetching connections for userId: ${userId} ---`);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const { connections, total } = await Connection.getUserConnections(userObjectId, 'all', page, limit);

    console.log(`--- Found ${connections.length} connections for userId: ${userId} ---`);

    res.status(200).json({
      success: true,
      message: 'Connections retrieved successfully',
      data: {
        connections,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getConnections controller:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving connections' });
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

    // Log connection block
    await Log.create({
      type: 'connection_block',
      actor: req.user.email,
      target: connection.alumni.toString(),
      message: `User ${req.user.email} blocked a connection`,
      meta: { connectionId: connection._id }
    });

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

const acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return notFoundResponse(res, 'Connection not found');
    }

    // You might want to add a check here to ensure the user accepting is the alumni
    // For example: if (connection.alumni.toString() !== req.user.id) { ... }

    await connection.accept();
    return successResponse(res, connection, 'Connection accepted successfully');
  } catch (error) {
    console.error('Accept connection error:', error);
    return badRequestResponse(res, error.message);
  }
};

const declineConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return notFoundResponse(res, 'Connection not found');
    }
    
    // You might want to add a check here as well
    
    await connection.reject();
    return successResponse(res, connection, 'Connection declined successfully');
  } catch (error) {
    console.error('Decline connection error:', error);
    return badRequestResponse(res, error.message);
  }
};

const disconnectConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return notFoundResponse(res, 'Connection not found.');
    }

    // Ensure the current user is part of this connection
    if (connection.student.toString() !== userId.toString() && connection.alumni.toString() !== userId.toString()) {
      return forbiddenResponse(res, 'You are not authorized to modify this connection.');
    }

    // Instead of changing status, we permanently delete the connection
    await Connection.findByIdAndDelete(connectionId);

    // Log connection disconnect
    await Log.create({
      type: 'connection_disconnect',
      actor: req.user.email,
      target: connection ? (connection.alumni?.toString() || connection.student?.toString()) : null,
      message: `User ${req.user.email} disconnected a connection`,
      meta: { connectionId }
    });

    return successResponse(res, null, 'Connection successfully disconnected and removed.');

  } catch (error) {
    console.error('Disconnect connection error:', error);
    return badRequestResponse(res, 'Failed to disconnect connection.');
  }
};

const getConnectionsByUser = async (req, res) => {
  // ...
};

module.exports = {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getConnections,
  getPendingRequests,
  getConnectionSuggestions,
  blockConnection,
  updateConnectionStrength,
  acceptConnectionRequest,
  declineConnectionRequest,
  disconnectConnection,
  getConnectionsByUser
}; 