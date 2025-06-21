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
  sendRealtimeMessage: (receiver: User, content: string) => void;
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

    console.log('[Store] > initialize: Attaching listeners.');

    socket.off('receiveMessage');
    socket.on('receiveMessage', (message: Message) => {
      console.log('[Store] > receiveMessage: ✅ Received message from socket:', JSON.stringify(message, null, 2));
      const currentUser = useAuthStore.getState().user;
      if (!currentUser || message.sender._id === currentUser._id) return;
      
      const transformedMessage = transformMessage(message);
      const otherUserId = message.sender._id;

      set(state => {
        console.log(`[Store] > receiveMessage: Updating state for conversation with ${otherUserId}.`);
        const oldMessages = state.messages[otherUserId] || [];
        const newMessages = [...oldMessages, transformedMessage];
        console.log(`[Store] > receiveMessage: New message count for conversation: ${newMessages.length}`);
        return {
          messages: { ...state.messages, [otherUserId]: newMessages }
        };
      });
    });

    // NEW: Add a specific listener for errors when sending a message
    socket.off('sendMessageError');
    socket.on('sendMessageError', (error) => {
      console.error('[Store] > sendMessageError: ❌ Received send error from server:', error);
      // Here you could add logic to show an error to the user, e.g., Toast.show(...)
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

  sendRealtimeMessage: (receiver: User, content: string) => {
    const socket = socketService.getSocket();
    const currentUser = useAuthStore.getState().user;

    if (!socket || !currentUser || !receiver) {
      console.error('MessageStore: Cannot send message, socket, user, or receiver not available.');
      return;
    }
    
    const optimisticMessage: Message = {
      _id: new Date().toISOString(),
      sender: currentUser,
      receiver: receiver,
      content: content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    
    console.log('[Store] > sendRealtimeMessage: ➡️ Sending message optimistically.');
    
    set(state => {
      const otherUserId = receiver._id;
      console.log(`[Store] > sendRealtimeMessage: Updating state for conversation with ${otherUserId}.`);
      const oldMessages = state.messages[otherUserId] || [];
      const newMessages = [...oldMessages, transformMessage(optimisticMessage)];
      console.log(`[Store] > sendRealtimeMessage: New message count for conversation: ${newMessages.length}`);
      return {
        messages: { ...state.messages, [otherUserId]: newMessages }
      };
    });
    
    const payload = { receiverId: receiver._id, content };
    
    console.log('[Store] > sendRealtimeMessage: ➡️  Attempting to emit event to server...');
    try {
      socket.emit('sendMessage', payload);
      console.log('[Store] > sendRealtimeMessage: ✅  Event emitted successfully.');
    } catch (e) {
      console.error('[Store] > sendRealtimeMessage: ❌  FAILED to emit event.', e);
    }
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

// This is now handled by the RootLayout and can be safely removed.
/*
useAuthStore.subscribe((state, prevState) => {
  if (state.user && !prevState.user) {
    useMessageStore.getState().initialize();
  }
});
*/