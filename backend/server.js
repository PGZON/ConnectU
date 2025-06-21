require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createAndSendMessage } = require('./controllers/messageController');


const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const queryRoutes = require('./routes/queries');
const connectionRoutes = require('./routes/connections');
const messageRoutes = require('./routes/messages');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const pollRoutes = require('./routes/polls');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connectu')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : [
        'http://localhost:3000', 
        'http://localhost:19006',
        'http://192.168.175.239:19006',
        'http://192.168.175.239:3000',
        'exp://192.168.175.239:19000',
        'exp://localhost:19000'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ConnectU Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/polls', pollRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-frontend-domain.com']
      : [
          'http://localhost:3000',
          'http://localhost:19006',
          'http://192.168.175.239:19006',
          'http://192.168.175.239:3000',
          'exp://192.168.175.239:19000',
          'exp://localhost:19000'
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }
});

// Add a map to track socket IDs to user IDs
const socketUserMap = new Map();

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = decoded; // Attach user payload to the socket object
    next();
  });
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'for user:', socket.user.id);
  socketUserMap.set(socket.user.id, socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} (user ${socket.user.id}) joined room ${roomId}`);
  });

  socket.on('sendMessage', async (data) => {
    // data: { receiverId, content }
    try {
      const { receiverId, content } = data;
      const senderId = socket.user.id;
      
      // The conversation room is a consistent ID between two users
      const roomId = [senderId, receiverId].sort().join('-');

      const savedMessage = await createAndSendMessage(senderId, receiverId, content);
      
      // Emit the saved message to the room
      io.to(roomId).emit('receiveMessage', savedMessage);

    } catch (error) {
      console.error('Socket sendMessage error:', error.message);
      // Optionally, emit an error event back to the sender
      socket.emit('sendMessageError', { message: error.message });
    }
  });

  // Typing indicators
  socket.on('typing', ({ to, from }) => {
    socket.to(to).emit('typing', { from });
  });
  socket.on('stopTyping', ({ to, from }) => {
    socket.to(to).emit('stopTyping', { from });
  });

  // Message delivery/read status
  socket.on('messageDelivered', ({ messageId, to }) => {
    socket.to(to).emit('messageDelivered', { messageId, to });
  });
  socket.on('messageRead', ({ userId }) => {
    socket.to(userId).emit('messageRead', { userId });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id, 'for user:', socket.user.id);
    socketUserMap.delete(socket.user.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 ConnectU Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, io }; 