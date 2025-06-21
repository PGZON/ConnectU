import { create } from 'zustand';
import { Message, User } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from './authStore';
import { socketService } from '@/utils/socket';

interface MessageState {
  messages: Record<string, Message[]>; // conversationId -> messages
  isLoading: boolean;
  error: string | null;
  initialize: () => void; // To set up listeners
  fetchMessages: (userId: string) => Promise<void>;
  sendRealtimeMessage: (receiverId: string, content: string) => void;
  markAsRead: (userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
  getTotalUnreadCount: () => number;
}

// Function to transform a message from backend format to frontend format
const transformMessage = (message: any): Message => {
  return {
    ...message,
    id: message._id,
    message: message.content,
    timestamp: message.createdAt,
  };
};

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,

  initialize: () => {
    const socket = socketService.getSocket();
    if (!socket) {
      console.log('MessageStore: Socket not available for initialization.');
      return;
    }

    console.log('MessageStore: Initializing listeners...');

    socket.off('receiveMessage'); // Remove previous listener
    socket.on('receiveMessage', (message: Message) => {
      console.log('MessageStore: Received message via socket', message);
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      const otherUserId = message.sender._id === currentUser._id ? message.receiver._id : message.sender._id;
      
      const transformedMessage = transformMessage(message);

      set((state) => {
        const conversation = state.messages[otherUserId] || [];
        return {
          messages: {
            ...state.messages,
            [otherUserId]: [...conversation, transformedMessage],
          },
        };
      });
    });
  },

  fetchMessages: async (userId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.getConversation(userId);
      if (response.success && response.data) {
        const transformedMessages = response.data.messages.map(transformMessage);

        set((state) => ({
          messages: {
            ...state.messages,
            [userId]: transformedMessages,
          },
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch messages');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendRealtimeMessage: (receiverId: string, content: string) => {
    const socket = socketService.getSocket();
    if (!socket) {
      console.error('MessageStore: Cannot send message, socket is not connected.');
      return;
    }
    
    const payload = {
      receiverId,
      content,
    };
    
    console.log('MessageStore: Sending message via socket', payload);
    socket.emit('sendMessage', payload);
  },
  
  markAsRead: async (userId: string) => {
    // ... (This can remain largely the same, but you might want to emit a socket event too)
  },

  getUnreadCount: (userId: string) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return 0;
    const userMessages = get().messages[userId] || [];
    return userMessages.filter(
      (msg) => msg.receiver._id === currentUser._id && !msg.isRead
    ).length;
  },

  getTotalUnreadCount: () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return 0;

    const allMessages = Object.values(get().messages).flat();
    
    return allMessages.filter(
      (msg) => msg.receiver._id === currentUser._id && !msg.isRead
    ).length;
  },
}));

// Initialize listeners when the app loads and user is authenticated
useAuthStore.subscribe((state, prevState) => {
  if (state.user && !prevState.user) {
    useMessageStore.getState().initialize();
  }
});