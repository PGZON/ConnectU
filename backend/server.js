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
const developmentOrigins = [
  /localhost/, 
  /192\.168\.175\.239/ // Using regex to match any port on this IP
];

const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  origin: (origin, callback) => {
    if (process.env.NODE_ENV !== 'production') {
      // In dev, allow from common dev origins
      if (!origin || developmentOrigins.some(pattern => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In prod, only allow from the production domain
      const productionOrigin = 'https://your-production-domain.com';
      if (origin === productionOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
};

app.use(cors(corsOptions));

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
  cors: corsOptions
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
  console.log(`[Socket.io] ✅  User connected: ${socket.user.id} with socket ID: ${socket.id}`);
  socketUserMap.set(socket.user.id, socket.id);

  // This event is no longer needed for direct messaging but can be kept for other features.
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} (user ${socket.user.id}) joined room ${roomId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, content } = data;
      const senderId = socket.user.id;
      
      console.log(`[Socket.io] ➡️  Received 'sendMessage' from ${senderId} to ${receiverId}`);
      console.log(`[Socket.io] 💾  Attempting to save message to database...`);
      
      const savedMessage = await createAndSendMessage(senderId, receiverId, content);
      
      console.log(`[Socket.io] ✅  Message saved to DB. ID: ${savedMessage._id}`);

      const recipientSocketId = socketUserMap.get(receiverId);

      if (recipientSocketId) {
        console.log(`[Socket.io] 📡  Recipient ${receiverId} is ONLINE. Emitting 'receiveMessage' to socket ${recipientSocketId}.`);
        io.to(recipientSocketId).emit('receiveMessage', savedMessage);
      } else {
        console.log(`[Socket.io] 📴  Recipient ${receiverId} is OFFLINE.`);
      }

    } catch (error) {
      console.error('[Socket.io] ❌  Error in sendMessage:', error);
      socket.emit('sendMessageError', { message: 'Failed to send message.' });
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
    console.log(`[Socket.io] 🔌  User disconnected: ${socket.user.id} with socket ID: ${socket.id}`);
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