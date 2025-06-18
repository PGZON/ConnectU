import { create } from 'zustand';
import { Connection, User } from '@/types';
import { mockConnections } from '@/mocks/connections';
import { mockUsers } from '@/mocks/users';

interface ConnectionState {
  connections: Connection[];
  pendingRequests: Connection[];
  isLoading: boolean;
  error: string | null;
  fetchConnections: () => Promise<void>;
  sendConnectionRequest: (userId: string) => Promise<void>;
  acceptConnectionRequest: (connectionId: string) => Promise<void>;
  declineConnectionRequest: (connectionId: string) => Promise<void>;
  getConnectionStatus: (userId: string) => 'none' | 'pending' | 'accepted';
  getConnectedUsers: () => User[];
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  pendingRequests: [],
  isLoading: false,
  error: null,
  
  fetchConnections: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUserId = '1'; // Assuming current user id is '1'
      
      const connections = mockConnections.filter(
        conn => (conn.senderId === currentUserId || conn.receiverId === currentUserId) && 
                conn.status === 'accepted'
      );
      
      const pendingRequests = mockConnections.filter(
        conn => conn.receiverId === currentUserId && conn.status === 'pending'
      );
      
      set({ 
        connections, 
        pendingRequests,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch connections', 
        isLoading: false 
      });
    }
  },
  
  sendConnectionRequest: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUserId = '1'; // Assuming current user id is '1'
      
      const newConnection: Connection = {
        id: `${Date.now()}`,
        senderId: currentUserId,
        receiverId: userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      set(state => ({
        connections: [...state.connections, newConnection],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send connection request', 
        isLoading: false 
      });
    }
  },
  
  acceptConnectionRequest: async (connectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pendingRequests = get().pendingRequests;
      const connections = get().connections;
      
      const updatedRequest = pendingRequests.find(req => req.id === connectionId);
      
      if (!updatedRequest) {
        throw new Error('Connection request not found');
      }
      
      const acceptedConnection: Connection = {
        ...updatedRequest,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      };
      
      set({
        connections: [...connections, acceptedConnection],
        pendingRequests: pendingRequests.filter(req => req.id !== connectionId),
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to accept connection request', 
        isLoading: false 
      });
    }
  },
  
  declineConnectionRequest: async (connectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pendingRequests = get().pendingRequests;
      
      set({
        pendingRequests: pendingRequests.filter(req => req.id !== connectionId),
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to decline connection request', 
        isLoading: false 
      });
    }
  },
  
  getConnectionStatus: (userId) => {
    const currentUserId = '1'; // Assuming current user id is '1'
    const { connections, pendingRequests } = get();
    
    const acceptedConnection = connections.find(
      conn => 
        (conn.senderId === currentUserId && conn.receiverId === userId) || 
        (conn.senderId === userId && conn.receiverId === currentUserId)
    );
    
    if (acceptedConnection) {
      return 'accepted';
    }
    
    const pendingConnection = [...connections, ...pendingRequests].find(
      conn => 
        (conn.senderId === currentUserId && conn.receiverId === userId) || 
        (conn.senderId === userId && conn.receiverId === currentUserId)
    );
    
    if (pendingConnection) {
      return 'pending';
    }
    
    return 'none';
  },
  
  getConnectedUsers: () => {
    const currentUserId = '1'; // Assuming current user id is '1'
    const { connections } = get();
    
    const connectedUserIds = connections
      .filter(conn => conn.status === 'accepted')
      .map(conn => 
        conn.senderId === currentUserId ? conn.receiverId : conn.senderId
      );
    
    return mockUsers.filter(user => connectedUserIds.includes(user.id));
  },
}));