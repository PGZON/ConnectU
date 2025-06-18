import { Query } from '@/types';
import { mockUsers } from './users';

export const mockQueries: Query[] = [
  {
    id: '1',
    studentId: '1',
    student: mockUsers.find(user => user.id === '1'),
    alumniId: '2',
    alumni: mockUsers.find(user => user.id === '2'),
    question: 'What skills should I focus on developing for a career in machine learning?',
    answer: 'Focus on strong fundamentals in math (linear algebra, calculus, statistics), Python programming, and frameworks like TensorFlow or PyTorch. Building projects that demonstrate your ability to apply ML to real problems is crucial.',
    isPublic: true,
    createdAt: '2025-06-14T08:00:00Z',
    answeredAt: '2025-06-14T14:30:00Z',
  },
  {
    id: '2',
    studentId: '4',
    student: mockUsers.find(user => user.id === '4'),
    alumniId: '5',
    alumni: mockUsers.find(user => user.id === '5'),
    question: 'How important is having a marketing internship before graduation?',
    answer: 'While not absolutely necessary, internships provide valuable real-world experience that sets you apart. They help you understand how marketing theory applies in practice and build your professional network.',
    isPublic: true,
    createdAt: '2025-06-15T10:00:00Z',
    answeredAt: '2025-06-15T16:15:00Z',
  },
  {
    id: '3',
    studentId: '1',
    student: mockUsers.find(user => user.id === '1'),
    question: 'What are the most in-demand programming languages for new graduates in 2025?',
    isPublic: true,
    createdAt: '2025-06-17T09:00:00Z',
  },
];