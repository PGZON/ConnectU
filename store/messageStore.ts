import { create } from 'zustand';
import { Message } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from './authStore';
import io from 'socket.io-client';

interface MessageState {
  messages: Record<string, Message[]>; // userId -> messages
  isLoading: boolean;
  error: string | null;
  fetchMessages: (userId: string) => Promise<void>;
  sendMessage: (userId: string, text: string) => Promise<void>;
  markAsRead: (userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
  getTotalUnreadCount: () => number;
}

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';
export const socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true, reconnection: true });

interface TypingState {
  [userId: string]: boolean;
}

export const useMessageStore = create<MessageState & { typing: TypingState }>((set, get) => {
  // Typing state
  const typing: TypingState = {};

  // Join the user's room on login
  useAuthStore.subscribe((state) => {
    if (state.user && state.user.id) {
      socket.emit('joinRoom', state.user.id);
    }
  });

  // Listen for incoming messages
  socket.off('receiveMessage');
  socket.on('receiveMessage', (message) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
    set((state) => ({
      messages: {
        ...state.messages,
        [otherUserId]: [...(state.messages[otherUserId] || []), message],
      },
    }));
    // Emit delivery status
    if (message.receiverId === currentUser.id) {
      socket.emit('messageDelivered', { messageId: message.id, to: message.senderId });
    }
  });

  // Listen for typing events
  socket.off('typing');
  socket.on('typing', ({ from }) => {
    set((state) => ({
      typing: { ...state.typing, [from]: true },
    }));
  });
  socket.off('stopTyping');
  socket.on('stopTyping', ({ from }) => {
    set((state) => ({
      typing: { ...state.typing, [from]: false },
    }));
  });

  // Listen for delivery/read status
  socket.off('messageDelivered');
  socket.on('messageDelivered', ({ messageId, to }) => {
    // Optionally update message status in state
    // Not implemented in this minimal example
  });
  socket.off('messageRead');
  socket.on('messageRead', ({ messageId, to }) => {
    // Optionally update message status in state
    // Not implemented in this minimal example
  });

  // Handle reconnection
  socket.on('reconnect', () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser && currentUser.id) {
      socket.emit('joinRoom', currentUser.id);
    }
  });

  // Handle offline/online
  socket.on('disconnect', () => {
    set({ error: 'Disconnected from chat server.' });
  });
  socket.on('connect', () => {
    set({ error: null });
  });

  return {
    messages: {},
    isLoading: false,
    error: null,
    typing: {},
    fetchMessages: async (userId) => {
      // Check if user is authenticated before making API calls
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) {
        console.log('Skipping fetchMessages - user not authenticated');
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        const response = await api.getConversation(userId, 1, 50);
        
        if (response.success && response.data) {
          const transformedMessages: Message[] = response.data.map((msg: any) => ({
            id: msg._id,
            senderId: msg.sender._id,
            receiverId: msg.receiver._id,
            message: msg.content,
            timestamp: msg.createdAt,
            isRead: msg.status === 'read',
          }));

          set(state => ({
            messages: {
              ...state.messages,
              [userId]: transformedMessages
            },
            isLoading: false
          }));
        } else {
          throw new Error(response.message || 'Failed to fetch messages');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch messages', 
          isLoading: false 
        });
      }
    },
    
    sendMessage: async (userId, text) => {
      try {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) throw new Error('User not authenticated');
        const messageData = {
          senderId: currentUser.id,
          receiverId: userId,
          message: text,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        // Emit to socket.io
        socket.emit('sendMessage', { roomId: userId, message: messageData });
        // Optionally, also send to backend for persistence
        const response = await api.sendMessage({ receiver: userId, content: text, type: 'text' });
        if (response.success && response.data) {
          set((state) => ({
            messages: {
              ...state.messages,
              [userId]: [...(state.messages[userId] || []), messageData],
            },
          }));
        } else {
          throw new Error(response.message || 'Failed to send message');
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to send message' });
      }
    },
    
    markAsRead: async (userId) => {
      try {
        const response = await api.markConversationAsRead(userId);
        
        if (response.success) {
          const currentMessages = get().messages[userId] || [];
          
          const updatedMessages = currentMessages.map(msg => 
            msg.senderId === userId && !msg.isRead
              ? { ...msg, isRead: true }
              : msg
          );
          
          set(state => ({
            messages: {
              ...state.messages,
              [userId]: updatedMessages
            }
          }));
          // Emit read status
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            socket.emit('messageRead', { userId });
          }
        } else {
          throw new Error(response.message || 'Failed to mark messages as read');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to mark messages as read' 
        });
      }
    },
    
    getUnreadCount: (userId) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return 0;

      const userMessages = get().messages[userId] || [];
      
      return userMessages.filter(
        msg => msg.senderId === userId && !msg.isRead
      ).length;
    },
    
    getTotalUnreadCount: () => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return 0;

      const allMessages = Object.values(get().messages).flat();
      
      return allMessages.filter(
        msg => msg.receiverId === currentUser.id && !msg.isRead
      ).length;
    },
    // Typing indicator actions
    startTyping: (userId) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        socket.emit('typing', { to: userId, from: currentUser.id });
      }
    },
    stopTyping: (userId) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        socket.emit('stopTyping', { to: userId, from: currentUser.id });
      }
    },
  };
});