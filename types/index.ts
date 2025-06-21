export type UserRole = 'student' | 'alumni' | 'admin';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImageUrl?: string;
  bio?: string;
  department?: string;
  graduationYear?: number;
  company?: string;
  position?: string;
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  user?: User;
  text: string;
  createdAt: string;
}

export interface Query {
  id: string;
  studentId: string;
  student?: User;
  alumniId?: string;
  alumni?: User;
  question: string;
  answer?: string;
  isPublic: boolean;
  createdAt: string;
  answeredAt?: string;
}

export interface Connection {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}