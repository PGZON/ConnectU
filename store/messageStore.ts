import { create } from 'zustand';
import { Message } from '@/types';
import { mockMessages } from '@/mocks/messages';

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

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,
  
  fetchMessages: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUserId = '1'; // Assuming current user id is '1'
      
      const userMessages = mockMessages.filter(
        msg => 
          (msg.senderId === currentUserId && msg.receiverId === userId) || 
          (msg.senderId === userId && msg.receiverId === currentUserId)
      ).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: userMessages
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages', 
        isLoading: false 
      });
    }
  },
  
  sendMessage: async (userId, text) => {
    try {
      const currentUserId = '1'; // Assuming current user id is '1'
      
      const newMessage: Message = {
        id: `${Date.now()}`,
        senderId: currentUserId,
        receiverId: userId,
        message: text,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      
      const currentMessages = get().messages[userId] || [];
      
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: [...currentMessages, newMessage]
        }
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
    }
  },
  
  markAsRead: async (userId) => {
    try {
      const currentUserId = '1'; // Assuming current user id is '1'
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
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to mark messages as read' 
      });
    }
  },
  
  getUnreadCount: (userId) => {
    const currentUserId = '1'; // Assuming current user id is '1'
    const userMessages = get().messages[userId] || [];
    
    return userMessages.filter(
      msg => msg.senderId === userId && !msg.isRead
    ).length;
  },
  
  getTotalUnreadCount: () => {
    const currentUserId = '1'; // Assuming current user id is '1'
    const allMessages = Object.values(get().messages).flat();
    
    return allMessages.filter(
      msg => msg.receiverId === currentUserId && !msg.isRead
    ).length;
  },
}));