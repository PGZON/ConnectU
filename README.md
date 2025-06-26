# ConnectU - Student-Alumni Interaction Platform

A full-stack platform for connecting students and alumni for career guidance, networking, and mentorship.

---

## ✨ Features

- **Role-based Authentication:** Student, Alumni, Admin
- **Instagram-style Posts:** Media uploads, likes, comments
- **Career Q&A System:** Students ask, alumni answer
- **Connection Management:** Request, accept, withdraw, disconnect
- **Real-time Messaging:** Chat with connections
- **Profile Management:** Rich profiles, image uploads
- **Admin Dashboard:** User, post, query, poll, announcement, and log management
- **Mobile-first & Responsive:** Modern UI for web and mobile
- **Cloudinary Media Uploads:** Images, videos, files
- **State Management:** Powered by Zustand
- **TypeScript:** End-to-end type safety

---

## 🗂️ Project Structure

```
ConnectU/
├── app/           # React Native (Expo) frontend
│   ├── admin/     # Admin panel screens
│   ├── (tabs)/    # Main user tabs (feed, network, messages, etc.)
│   ├── ...        # Other screens (profile, post, query, etc.)
├── backend/       # Node.js/Express backend API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── config/
├── components/    # Reusable UI components
├── store/         # Zustand state stores
├── types/         # Shared TypeScript types
├── constants/     # Color palette, etc.
└── utils/         # API, date, socket utilities
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)
- Cloudinary account

### Backend

```bash
cd backend
npm install
cp env.example .env   # Create and edit your .env file
npm run dev           # Starts server at http://localhost:5000
```

### Frontend

```bash
npm install
npm start             # Starts Expo dev server
```
- Edit `utils/api.ts` to set your API base URL if needed.
- Use Expo Go app or an emulator to preview.

---

## 🛠️ Tech Stack

**Frontend:**  
- React Native (Expo), TypeScript, Zustand, Expo Router, NativeWind, @expo/vector-icons

**Backend:**  
- Node.js, Express, MongoDB (Mongoose), JWT, Cloudinary, Socket.io

---

## 🎨 Theming

Color palette (`constants/colors.ts`):

| Name        | Value      | Usage                |
|-------------|------------|----------------------|
| primary     | #6C63FF    | Brand, highlights    |
| secondary   | #FF6584    | Accent               |
| background  | #F8F9FA    | App background       |
| card        | #FFFFFF    | Card backgrounds     |
| text        | #333333    | Main text            |
| textSecondary| #6C757D   | Secondary text       |
| border      | #E9ECEF    | Borders              |
| success     | #28A745    | Success              |
| error       | #DC3545    | Errors               |
| warning     | #FFC107    | Warnings             |
| info        | #17A2B8    | Info                 |
| inactive    | #ADB5BD    | Inactive elements    |
| highlight   | #E6E6FF    | Highlight bg         |

---

## 🧩 Main Components

- `PostCard`, `UserCard`, `QueryCard`, `MessageBubble`, `Avatar`, `Button`, `AnimatedLogo`, `Card`

---

## 🏛️ Backend Structure

**Controllers:**  
- `authController.js`, `userController.js`, `postController.js`, `queryController.js`, `connectionController.js`, `messageController.js`, `pollController.js`

**Models:**  
- `User.js`, `Post.js`, `Query.js`, `Connection.js`, `Message.js`, `Poll.js`, `Announcement.js`, `Log.js`, `PreapprovedStudent.js`, `preApproveAlumni.js`

**Routes:**  
- `auth.js`, `users.js`, `posts.js`, `queries.js`, `connections.js`, `messages.js`, `polls.js`, `admin.js`, `verify.js`

---

## 🗃️ State Management

Zustand stores in `/store`:
- `authStore.ts` (auth/user)
- `feedStore.ts` (posts/feed)
- `queryStore.ts` (Q&A)
- `connectionStore.ts` (connections)
- `messageStore.ts` (messaging)

---

## 🧑‍💻 TypeScript Types

See `types/index.ts` for all shared types:  
- `User`, `Post`, `Comment`, `Query`, `Answer`, `Connection`, `Message`, etc.

---

## 🛡️ Security & Auth

- JWT-based authentication
- Role-based access (student, alumni, admin)
- Secure password hashing (bcryptjs)
- Rate limiting, helmet, CORS

---

## ☁️ Media Uploads

- Cloudinary integration for images, videos, and files
- See `backend/config/cloudinary.js` for upload/optimization logic

---

## 🧪 Testing

- Backend: Jest & Supertest (`npm run test` in `/backend`)
- Frontend: Manual and E2E (add your preferred tools)

---

## 🛠️ Deployment

- Expo EAS for mobile/web builds (see `app.json`)
- Backend: Deploy to any Node.js host (Heroku, Render, etc.)

---

## 📚 API Reference

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

### Polls
- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create new poll
- `POST /api/polls/:id/vote` - Vote in a poll
- `GET /api/polls/:id/results` - Get poll results

### Announcements
- `GET /api/admin/announcements` - Get all announcements
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/activate` - Activate user
- `DELETE /api/admin/users/:id` - Deactivate/delete user

---

## 👥 Admin Panel

- Modern, responsive sidebar (collapses to hamburger on mobile)
- Manage users, posts, queries, polls, announcements, logs, and AI manager
- Built with React Native for web/mobile parity

---

## 📦 Scripts

**Frontend:**
- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — Platform-specific

**Backend:**
- `npm run dev` — Start backend with nodemon
- `npm start` — Start backend

---

## 📝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit and push
4. Open a PR

---

## 📄 License

MIT