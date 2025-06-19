import { create } from 'zustand';
import { Query } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from './authStore';

interface QueryState {
  queries: Query[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  fetchQueries: (page?: number) => Promise<void>;
  askQuery: (title: string, content: string, category: string, priority?: string) => Promise<void>;
  answerQuery: (queryId: string, content: string) => Promise<void>;
  refreshQueries: () => Promise<void>;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  
  fetchQueries: async (page = 1) => {
    // Check if user is authenticated before making API calls
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      console.log('Skipping fetchQueries - user not authenticated');
      return;
    }

    if (page === 1) {
      set({ isLoading: true, error: null });
    }
    
    try {
      const response = await api.getQueries(page, 20);
      
      if (response.success && response.data) {
        const transformedQueries: Query[] = response.data.map((query: any) => ({
          id: query._id,
          studentId: query.student._id,
          student: {
            id: query.student._id,
            name: query.student.name,
            email: query.student.email,
            role: query.student.role,
            profileImageUrl: query.student.profileImageUrl,
          },
          alumniId: query.assignedAlumni?.[0]?._id,
          alumni: query.assignedAlumni?.[0] ? {
            id: query.assignedAlumni[0]._id,
            name: query.assignedAlumni[0].name,
            email: query.assignedAlumni[0].email,
            role: query.assignedAlumni[0].role,
            profileImageUrl: query.assignedAlumni[0].profileImageUrl,
          } : undefined,
          question: `${query.title}\n\n${query.content}`,
          answer: query.answers?.[0]?.content,
          isPublic: query.isPublic,
          createdAt: query.createdAt,
          answeredAt: query.answers?.[0]?.createdAt,
        }));

        if (page === 1) {
          set({ 
            queries: transformedQueries, 
            isLoading: false,
            currentPage: 1,
            hasMore: response.pagination?.hasNextPage || false
          });
        } else {
          set({ 
            queries: [...get().queries, ...transformedQueries],
            currentPage: page,
            hasMore: response.pagination?.hasNextPage || false
          });
        }
      } else {
        throw new Error(response.message || 'Failed to fetch queries');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch queries', 
        isLoading: false 
      });
    }
  },

  refreshQueries: async () => {
    await get().fetchQueries(1);
  },
  
  askQuery: async (title, content, category, priority = 'medium') => {
    set({ isLoading: true, error: null });
    
    try {
      const queryData = {
        title,
        content,
        category,
        priority,
        isPublic: true,
      };

      const response = await api.createQuery(queryData);
      
      if (response.success && response.data) {
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser) {
          const newQuery: Query = {
            id: response.data._id,
            studentId: currentUser.id,
            student: {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              profileImageUrl: currentUser.profileImageUrl,
            },
            question: `${title}\n\n${content}`,
            isPublic: true,
            createdAt: response.data.createdAt,
          };
          
          set(state => ({
            queries: [newQuery, ...state.queries],
            isLoading: false
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to ask query');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to ask query', 
        isLoading: false 
      });
    }
  },
  
  answerQuery: async (queryId, content) => {
    set({ isLoading: true, error: null });
    
    try {
      const answerData = {
        content,
        attachments: [],
      };

      const response = await api.addAnswer(queryId, answerData);
      
      if (response.success) {
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser) {
          const updatedQueries = get().queries.map(query => {
            if (query.id === queryId) {
              return {
                ...query,
                answer: content,
                alumniId: currentUser.id,
                alumni: {
                  id: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                  role: currentUser.role,
                  profileImageUrl: currentUser.profileImageUrl,
                },
                answeredAt: new Date().toISOString(),
              };
            }
            return query;
          });
          
          set({ 
            queries: updatedQueries,
            isLoading: false 
          });
        }
      } else {
        throw new Error(response.message || 'Failed to answer query');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to answer query', 
        isLoading: false 
      });
    }
  },
}));