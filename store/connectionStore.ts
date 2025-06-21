import { create } from 'zustand';
import { Connection, User } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from './authStore';
import Toast from 'react-native-toast-message';

interface ConnectionState {
  connections: Connection[];
  allUsers: User[];
  discoverUsers: User[];
  receivedRequests: Connection[];
  sentRequests: Connection[];
  establishedConnections: Connection[];
  connectedUsers: User[];
  isLoading: boolean;
  error: string | null;
  fetchAllUsers: (page?: number, limit?: number) => Promise<void>;
  fetchConnections: () => Promise<void>;
  processConnections: () => void;
  sendConnectionRequest: (alumniId: string, message: string) => Promise<any>;
  acceptConnection: (connectionId: string) => Promise<void>;
  declineConnection: (connectionId: string) => Promise<void>;
  getConnectionStatus: (otherUserId: string) => { status: string; connectionId?: string };
  withdrawConnectionRequest: (connectionId: string) => Promise<void>;
  disconnectUser: (connectionId: string) => Promise<void>;
}

const useConnectionStore = create<ConnectionState>((set, get) => {
  const getUserId = () => useAuthStore.getState().user?.id;

  return {
    connections: [],
    allUsers: [],
    discoverUsers: [],
    receivedRequests: [],
    sentRequests: [],
    establishedConnections: [],
    connectedUsers: [],
    isLoading: false,
    error: null,

    processConnections: () => {
      const userId = getUserId();
      if (!userId) return;

      const { connections, allUsers } = get();
      
      const received = connections.filter(c => c.alumni?._id === userId && c.status === 'pending');
      const sent = connections.filter(c => c.student?._id === userId && c.status === 'pending');
      const established = connections.filter(c => c.status === 'accepted');

      const connectedUsers: User[] = established.map(c => {
        return c.student?._id === userId ? c.alumni! : c.student!;
      }).filter(Boolean);

      const connectedUserIds = new Set<string>();
      userId && connectedUserIds.add(userId);

      connections.forEach(c => {
        if(c.student?._id) connectedUserIds.add(c.student._id);
        if(c.alumni?._id) connectedUserIds.add(c.alumni._id);
      });

      const discover = allUsers.filter(u => !connectedUserIds.has(u._id));
      
      console.log('--- FINAL PROCESSED STATE ---');
      console.log('Received Requests (Content):', JSON.stringify(received, null, 2));
      console.log('Sent Requests (Content):', JSON.stringify(sent, null, 2));
      console.log('Established Connections (Content):', JSON.stringify(established, null, 2));
      console.log('-----------------------------');

      set({
        receivedRequests: received,
        sentRequests: sent,
        establishedConnections: established,
        discoverUsers: discover,
        connectedUsers: connectedUsers,
      });
    },

    fetchAllUsers: async (page = 1, limit = 50) => {
      set({ isLoading: true });
      try {
        const response = await api.getAllUsers(page, limit);
        console.log('--- Raw API Response from getAllUsers ---');
        console.log(JSON.stringify(response, null, 2));
        console.log('------------------------------------');
        if (response.success) {
          set({ allUsers: response.data?.users || [] });
          get().processConnections();
        } else {
          set({ error: response.message || 'Failed to fetch users' });
        }
      } catch (error: any) {
        set({ error: error.message });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchConnections: async () => {
      const userId = getUserId();
      if (!userId) return;
      set({ isLoading: true });
      try {
        const response = await api.getConnections(userId, 1, 100);
        console.log('--- Raw API Response from getConnections ---');
        console.log(JSON.stringify(response, null, 2));
        console.log('---------------------------------------');
        if (response.success) {
          const backendConnections = response.data?.connections || [];
          set({ connections: backendConnections });
          get().processConnections();
        } else {
          set({ error: response.message || 'Failed to fetch connections' });
        }
      } catch (error: any) {
        set({ error: error.message });
      } finally {
        set({ isLoading: false });
      }
    },

    sendConnectionRequest: async (alumniId, message) => {
      try {
        const response = await api.sendConnectionRequest({ alumniId: alumniId });
        if (response.success) {
          Toast.show({ type: 'success', text1: 'Request Sent!' });
          get().fetchConnections();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send request';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
        console.error('sendConnectionRequest error:', error);
      }
    },

    acceptConnection: async (connectionId) => {
      set({ isLoading: true });
      try {
        const response = await api.acceptConnection(connectionId);
        if (response.success) {
          Toast.show({ type: 'success', text1: 'Connection Accepted' });
          get().fetchConnections();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
         const message = error instanceof Error ? error.message : 'Failed to accept request';
         Toast.show({ type: 'error', text1: 'Error', text2: message });
         console.error('acceptConnectionRequest error:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    declineConnection: async (connectionId: string) => {
      set({ isLoading: true });
      try {
        const response = await api.rejectConnection(connectionId);
        if (response.success) {
          Toast.show({ type: 'info', text1: 'Request Declined' });
          get().fetchConnections(); // Refresh data
        } else {
          throw new Error(response.message);
        }
      } catch (error: any) {
        const message = error.message || 'Failed to decline request';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      } finally {
        set({ isLoading: false });
      }
    },

    withdrawConnectionRequest: async (connectionId: string) => {
      try {
        const response = await api.rejectConnection(connectionId);
        if (response.success) {
          Toast.show({ type: 'info', text1: 'Request Withdrawn' });
          get().fetchConnections();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to withdraw request';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      }
    },

    disconnectUser: async (connectionId: string) => {
      try {
        const response = await api.rejectConnection(connectionId);
        if (response.success) {
          Toast.show({ type: 'info', text1: 'User Disconnected' });
          get().fetchConnections();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to disconnect user';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      }
    },
    
    getConnectionStatus: (otherUserId: string) => {
      const { sentRequests, receivedRequests, establishedConnections } = get();
      
      if (establishedConnections.some(c => c.student?.id === otherUserId || c.alumni?.id === otherUserId)) {
        const conn = establishedConnections.find(c => c.student?.id === otherUserId || c.alumni?.id === otherUserId);
        return { status: 'connected', connectionId: conn?._id };
      }
      
      if (sentRequests.some(c => c.alumni?.id === otherUserId)) {
        const conn = sentRequests.find(c => c.alumni?.id === otherUserId);
        return { status: 'pending_sent', connectionId: conn?._id };
      }
      
      if (receivedRequests.some(c => c.student?.id === otherUserId)) {
        const conn = receivedRequests.find(c => c.student?.id === otherUserId);
        return { status: 'pending_received', connectionId: conn?._id };
      }
      
      return { status: 'none', connectionId: undefined };
    },
  };
});

export default useConnectionStore;