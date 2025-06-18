import { Post } from '@/types';
import { mockUsers } from './users';

export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '2',
    user: mockUsers.find(user => user.id === '2'),
    caption: 'Just wrapped up a great internship program at Google. If any CS students are looking for summer opportunities, feel free to reach out!',
    mediaUrl: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    mediaType: 'image',
    likes: ['1', '4'],
    comments: [
      {
        id: '101',
        userId: '1',
        user: mockUsers.find(user => user.id === '1'),
        text: "That's awesome! I'd love to hear more about the application process.",
        createdAt: '2025-06-15T14:30:00Z',
      }
    ],
    createdAt: '2025-06-15T12:00:00Z',
  },
  {
    id: '2',
    userId: '3',
    user: mockUsers.find(user => user.id === '3'),
    caption: 'Career tip: Build a portfolio that showcases your problem-solving skills, not just your technical abilities. Employers want to see how you approach challenges.',
    likes: ['1', '2', '5'],
    comments: [],
    createdAt: '2025-06-14T10:15:00Z',
  },
  {
    id: '3',
    userId: '5',
    user: mockUsers.find(user => user.id === '5'),
    caption: 'Excited to announce that Amazon is hiring data science interns for the fall semester! Great opportunity for statistics and CS majors.',
    mediaUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    mediaType: 'image',
    likes: ['1', '4'],
    comments: [
      {
        id: '102',
        userId: '4',
        user: mockUsers.find(user => user.id === '4'),
        text: 'Is this open to marketing students with data analysis experience?',
        createdAt: '2025-06-13T16:45:00Z',
      },
      {
        id: '103',
        userId: '5',
        user: mockUsers.find(user => user.id === '5'),
        text: 'Absolutely! We value diverse backgrounds. Apply and highlight your data analysis projects.',
        createdAt: '2025-06-13T17:20:00Z',
      }
    ],
    createdAt: '2025-06-13T15:30:00Z',
  },
];