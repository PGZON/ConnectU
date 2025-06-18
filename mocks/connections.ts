import { Connection } from '@/types';
import { mockUsers } from './users';

export const mockConnections: Connection[] = [
  {
    id: '1',
    senderId: '1',
    sender: mockUsers.find(user => user.id === '1'),
    receiverId: '2',
    receiver: mockUsers.find(user => user.id === '2'),
    status: 'accepted',
    createdAt: '2025-06-10T09:00:00Z',
    updatedAt: '2025-06-10T10:30:00Z',
  },
  {
    id: '2',
    senderId: '1',
    sender: mockUsers.find(user => user.id === '1'),
    receiverId: '3',
    receiver: mockUsers.find(user => user.id === '3'),
    status: 'pending',
    createdAt: '2025-06-12T14:00:00Z',
  },
  {
    id: '3',
    senderId: '4',
    sender: mockUsers.find(user => user.id === '4'),
    receiverId: '5',
    receiver: mockUsers.find(user => user.id === '5'),
    status: 'accepted',
    createdAt: '2025-06-08T11:00:00Z',
    updatedAt: '2025-06-08T15:45:00Z',
  },
];