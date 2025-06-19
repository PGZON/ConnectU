# ConnectU - Student-Alumni Interaction Platform

A comprehensive platform for connecting students with alumni for career guidance, networking, and mentorship.

## Features

- 🔐 **Role-based Authentication** (Student, Alumni, Admin)
- 📱 **Instagram-style Posts** with media support
- ❓ **Career Q&A System** between students and alumni
- 🔗 **Connection Management** with request/accept workflow
- 💬 **Real-time Messaging** between connected users
- 👤 **Profile Management** with image uploads
- 📊 **Admin Dashboard** (future scope)

## Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **Expo Router** for navigation
- **NativeWind** for styling

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Cloudinary** for media uploads
- **Socket.io** for real-time features (ready for implementation)

## Project Structure

```
connectU/
├── app/                    # Frontend screens
├── backend/               # Backend API
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── config/           # Configuration files
├── components/           # Reusable components
├── store/               # Zustand stores
├── types/               # TypeScript types
└── utils/               # Frontend utilities
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Expo CLI
- Cloudinary account (for media uploads)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/connectu
   JWT_SECRET=your-super-secret-jwt-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update API configuration:**
   Edit `utils/api.ts` and update the `API_BASE_URL`:
   ```typescript
   const API_BASE_URL = __DEV__ ? 'http://localhost:5000/api' : 'https://your-production-api.com/api';
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile/:id` - Update user profile
- `GET /api/users/role/:role` - Get users by role

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment

### Queries
- `GET /api/queries` - Get all queries
- `POST /api/queries` - Create new query
- `PUT /api/queries/:id/answer` - Answer query

### Connections
- `POST /api/connections/request` - Send connection request
- `PUT /api/connections/:id/accept` - Accept connection
- `PUT /api/connections/:id/reject` - Reject connection
- `GET /api/connections/user/:userId` - Get user connections

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `PUT /api/messages/conversation/:userId/read` - Mark as read

## Database Models

### User
- Basic info (name, email, password)
- Role-based fields (student/alumni specific)
- Profile information (bio, images, social links)
- Verification status

### Post
- Content and media
- Engagement (likes, comments)
- Privacy settings
- Analytics

### Query
- Question details
- Category and priority
- Assignment to alumni
- Answers and feedback

### Connection
- Request/response workflow
- Connection strength
- Interaction tracking

### Message
- Real-time messaging
- Media support
- Read status
- Message history

## State Management

The app uses Zustand for state management with the following stores:

- **authStore** - Authentication and user data
- **feedStore** - Posts and feed management
- **queryStore** - Q&A system
- **connectionStore** - Connection management
- **messageStore** - Messaging system

## Development

### Adding New Features

1. **Backend:**
   - Create model in `backend/models/`
   - Add controller in `backend/controllers/`
   - Create routes in `backend/routes/`
   - Update API client in `utils/api.ts`

2. **Frontend:**
   - Create screen in `app/`
   - Add to store if needed
   - Update types in `types/index.ts`

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
npm test
```

## Deployment

### Backend
- Deploy to platforms like Heroku, Railway, or DigitalOcean
- Set up MongoDB Atlas for database
- Configure environment variables
- Set up Cloudinary for media storage

### Frontend
- Build with Expo EAS
- Deploy to app stores
- Configure production API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository.