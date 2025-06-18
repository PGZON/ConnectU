import { Message } from '@/types';

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    receiverId: '2',
    message: 'Hi Sarah, I saw your post about the Google internship. Could you share some tips on the interview process?',
    timestamp: '2025-06-16T09:30:00Z',
    isRead: true,
  },
  {
    id: '2',
    senderId: '2',
    receiverId: '1',
    message: 'Hey Alex! Sure thing. The process usually involves a coding challenge followed by 2-3 technical interviews. Focus on data structures and algorithms.',
    timestamp: '2025-06-16T09:45:00Z',
    isRead: true,
  },
  {
    id: '3',
    senderId: '1',
    receiverId: '2',
    message: "That's really helpful. Any specific resources you'd recommend for preparation?",
    timestamp: '2025-06-16T10:00:00Z',
    isRead: true,
  },
  {
    id: '4',
    senderId: '2',
    receiverId: '1',
    message: "LeetCode and HackerRank are great for practice. Also, check out \"Cracking the Coding Interview\" book. I'd be happy to do a mock interview with you sometime!",
    timestamp: '2025-06-16T10:15:00Z',
    isRead: false,
  },
];