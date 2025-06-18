import { create } from 'zustand';
import { Post } from '@/types';
import { mockPosts } from '@/mocks/posts';

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  createPost: (caption: string, mediaUrl?: string, mediaType?: 'image' | 'video') => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ posts: mockPosts, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch posts', 
        isLoading: false 
      });
    }
  },
  
  likePost: async (postId) => {
    try {
      const currentPosts = get().posts;
      const updatedPosts = currentPosts.map(post => {
        if (post.id === postId) {
          const currentUserLiked = post.likes.includes('1'); // Assuming current user id is '1'
          const updatedLikes = currentUserLiked
            ? post.likes.filter(id => id !== '1')
            : [...post.likes, '1'];
          
          return { ...post, likes: updatedLikes };
        }
        return post;
      });
      
      set({ posts: updatedPosts });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to like post' 
      });
    }
  },
  
  addComment: async (postId, text) => {
    try {
      const currentPosts = get().posts;
      const updatedPosts = currentPosts.map(post => {
        if (post.id === postId) {
          const newComment = {
            id: `${Date.now()}`,
            userId: '1', // Assuming current user id is '1'
            user: {
              id: '1',
              name: 'Alex Johnson',
              email: 'alex@university.edu',
              role: 'student',
              profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            },
            text,
            createdAt: new Date().toISOString(),
          };
          
          return { 
            ...post, 
            comments: [...post.comments, newComment] 
          };
        }
        return post;
      });
      
      set({ posts: updatedPosts });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add comment' 
      });
    }
  },
  
  createPost: async (caption, mediaUrl, mediaType) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost: Post = {
        id: `${Date.now()}`,
        userId: '1', // Assuming current user id is '1'
        user: {
          id: '1',
          name: 'Alex Johnson',
          email: 'alex@university.edu',
          role: 'student',
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        },
        caption,
        mediaUrl,
        mediaType,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      
      const currentPosts = get().posts;
      set({ 
        posts: [newPost, ...currentPosts],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create post', 
        isLoading: false 
      });
    }
  },
}));