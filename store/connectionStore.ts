import { create } from 'zustand';
import { Connection, User } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from './authStore';

interface ConnectionState {
  connections: Connection[];
  pendingRequests: Connection[];
  isLoading: boolean;
  error: string | null;
  fetchConnections: () => Promise<void>;
  sendConnectionRequest: (alumniId: string, message?: string) => Promise<void>;
  acceptConnectionRequest: (connectionId: string) => Promise<void>;
  declineConnectionRequest: (connectionId: string) => Promise<void>;
  getConnectionStatus: (userId: string) => 'none' | 'pending' | 'accepted';
  getConnectedUsers: () => User[];
}

const getUserId = () => {
  const { user } = useAuthStore.getState();
  return user?.id || user?._id || null;
};

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  pendingRequests: [],
  isLoading: false,
  error: null,
  
  fetchConnections: async () => {
    // Guard: Ensure userId is available before making API call
    const userId = getUserId();
    if (!userId) {
      console.warn('fetchConnections: User ID is undefined! Delaying API call until user is loaded.');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await api.getConnections(userId, 1, 100);
      
      if (response.success && response.data && Array.isArray(response.data.connections)) {
        const transformedConnections: Connection[] = response.data.connections.map((conn: any) => ({
          id: conn._id,
          senderId: conn.student._id,
          sender: {
            id: conn.student._id,
            name: conn.student.name,
            email: conn.student.email,
            role: conn.student.role,
            profileImageUrl: conn.student.profileImageUrl,
          },
          receiverId: conn.alumni._id,
          receiver: {
            id: conn.alumni._id,
            name: conn.alumni.name,
            email: conn.alumni.email,
            role: conn.alumni.role,
            profileImageUrl: conn.alumni.profileImageUrl,
          },
          status: conn.status,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
        }));

        const acceptedConnections = transformedConnections.filter(conn => conn.status === 'accepted');
        const pendingConnections = transformedConnections.filter(conn => conn.status === 'pending');
        
        set({ 
          connections: acceptedConnections, 
          pendingRequests: pendingConnections,
          isLoading: false 
        });
      } else {
        throw new Error(response.message || 'Failed to fetch connections');
      }
    } catch (error) {
      console.error('fetchConnections error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch connections', 
        isLoading: false 
      });
    }
  },
  
  sendConnectionRequest: async (alumniId, message) => {
    set({ isLoading: true, error: null });
    
    try {
      const requestData = {
        alumniId,
        message: message || '',
        connectionType: 'general',
      };

      const response = await api.sendConnectionRequest(requestData);
      
      if (response.success) {
        // Refresh connections to get updated list
        await get().fetchConnections();
      } else {
        throw new Error(response.message || 'Failed to send connection request');
      }
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
      const response = await api.acceptConnection(connectionId);
      
      if (response.success) {
        // Refresh connections to get updated list
        await get().fetchConnections();
      } else {
        throw new Error(response.message || 'Failed to accept connection request');
      }
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
      const response = await api.rejectConnection(connectionId);
      
      if (response.success) {
        // Refresh connections to get updated list
        await get().fetchConnections();
      } else {
        throw new Error(response.message || 'Failed to decline connection request');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to decline connection request', 
        isLoading: false 
      });
    }
  },
  
  getConnectionStatus: (userId) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return 'none';

    const { connections, pendingRequests } = get();
    
    const acceptedConnection = connections.find(
      conn => 
        (conn.senderId === currentUser.id && conn.receiverId === userId) || 
        (conn.senderId === userId && conn.receiverId === currentUser.id)
    );
    
    if (acceptedConnection) {
      return 'accepted';
    }
    
    const pendingConnection = [...connections, ...pendingRequests].find(
      conn => 
        (conn.senderId === currentUser.id && conn.receiverId === userId) || 
        (conn.senderId === userId && conn.receiverId === currentUser.id)
    );
    
    if (pendingConnection) {
      return 'pending';
    }
    
    return 'none';
  },
  
  getConnectedUsers: () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return [];

    const { connections } = get();
    
    const connectedUserIds = connections
      .filter(conn => conn.status === 'accepted')
      .map(conn => 
        conn.senderId === currentUser.id ? conn.receiverId : conn.senderId
      );
    
    // Extract unique users from connections
    const connectedUsers: User[] = [];
    const seenIds = new Set();
    
    connections.forEach(conn => {
      if (conn.status === 'accepted') {
        const otherUser = conn.senderId === currentUser.id ? conn.receiver : conn.sender;
        if (otherUser && !seenIds.has(otherUser.id)) {
          connectedUsers.push(otherUser);
          seenIds.add(otherUser.id);
        }
      }
    });
    
    return connectedUsers;
  },
}));