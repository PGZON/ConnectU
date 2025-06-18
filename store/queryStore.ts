import { create } from 'zustand';
import { Query } from '@/types';
import { mockQueries } from '@/mocks/queries';
import { mockUsers } from '@/mocks/users';

interface QueryState {
  queries: Query[];
  isLoading: boolean;
  error: string | null;
  fetchQueries: () => Promise<void>;
  askQuery: (question: string, alumniId?: string, isPublic?: boolean) => Promise<void>;
  answerQuery: (queryId: string, answer: string) => Promise<void>;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: [],
  isLoading: false,
  error: null,
  
  fetchQueries: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ 
        queries: mockQueries,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch queries', 
        isLoading: false 
      });
    }
  },
  
  askQuery: async (question, alumniId, isPublic = true) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUserId = '1'; // Assuming current user id is '1'
      
      const newQuery: Query = {
        id: `${Date.now()}`,
        studentId: currentUserId,
        student: mockUsers.find(user => user.id === currentUserId),
        alumniId,
        alumni: alumniId ? mockUsers.find(user => user.id === alumniId) : undefined,
        question,
        isPublic,
        createdAt: new Date().toISOString(),
      };
      
      set(state => ({
        queries: [newQuery, ...state.queries],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to ask query', 
        isLoading: false 
      });
    }
  },
  
  answerQuery: async (queryId, answer) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUserId = '2'; // Assuming current user is an alumni with id '2'
      
      const updatedQueries = get().queries.map(query => {
        if (query.id === queryId) {
          return {
            ...query,
            answer,
            alumniId: currentUserId,
            alumni: mockUsers.find(user => user.id === currentUserId),
            answeredAt: new Date().toISOString(),
          };
        }
        return query;
      });
      
      set({ 
        queries: updatedQueries,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to answer query', 
        isLoading: false 
      });
    }
  },
}));