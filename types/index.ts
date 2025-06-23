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
  isVerified?: boolean;
}

export interface Media {
  url: string;
  type: 'image' | 'video';
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  caption: string;
  media?: Media[];
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
  _id: string;
  id?: string;
  sender: User;
  receiver: User;
  content: string;
  createdAt: string;
  timestamp?: string;
  message?: string;
  isRead: boolean;
  status?: 'sent' | 'delivered' | 'read';
}