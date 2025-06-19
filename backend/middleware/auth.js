const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, getTokenFromHeader } = require('../utils/jwtUtils');

// Middleware to protect routes - requires valid JWT token
const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if token is correct type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.message === 'Token expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Middleware to check if user is verified
const requireVerification = async (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required'
    });
  }
  next();
};

// Middleware to check specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Middleware to check if user is student
const requireStudent = authorize('student');

// Middleware to check if user is alumni
const requireAlumni = authorize('alumni');

// Middleware to check if user is admin
const requireAdmin = authorize('admin');

// Middleware to check if user can access resource (owner or admin)
const requireOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user is owner or admin
      const isOwner = resource.author && resource.author.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};

// Middleware to check if users are connected (for messaging)
const requireConnection = async (req, res, next) => {
  try {
    const Connection = require('../models/Connection');
    const otherUserId = req.params.userId || req.body.receiver;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    // Check if users are connected
    const connection = await Connection.areConnected(req.user._id, otherUserId);

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: 'You can only message connected users'
      });
    }

    next();
  } catch (error) {
    console.error('Connection check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during connection verification'
    });
  }
};

// Middleware to update last active timestamp
const updateLastActive = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        lastActive: new Date()
      });
    }
    next();
  } catch (error) {
    console.error('Update last active error:', error);
    next(); // Don't block the request if this fails
  }
};

// Optional authentication middleware (doesn't require token but sets user if available)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token is invalid, but we don't block the request
      console.error('Optional auth error:', error);
    }
  }

  next();
};

module.exports = {
  protect,
  requireVerification,
  authorize,
  requireStudent,
  requireAlumni,
  requireAdmin,
  requireOwnership,
  requireConnection,
  updateLastActive,
  optionalAuth
}; 