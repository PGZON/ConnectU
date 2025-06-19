const jwt = require('jsonwebtoken');

const JWT_EXPIRE = '7d';
const REFRESH_TOKEN_EXPIRE = '30d';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || JWT_EXPIRE }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || REFRESH_TOKEN_EXPIRE }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id || !decoded.type) {
      throw new Error('Invalid token structure');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

// Decode token without verification (for getting payload)
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      throw new Error('Invalid token structure');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    // Add 5 seconds buffer to prevent edge cases
    return Date.now() >= (decoded.exp * 1000) - 5000;
  } catch (error) {
    return true;
  }
};

// Get token from request headers
const getTokenFromHeader = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }
    return token;
  }
  return null;
};

// Generate access and refresh token pair
const generateTokenPair = (userId) => {
  const accessToken = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRE || JWT_EXPIRE
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenFromHeader,
  generateTokenPair
}; 