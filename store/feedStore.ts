import { create } from 'zustand';
import { Post } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from './authStore';

export const transformApiPost = (post: any): Post => ({
  id: post._id,
  userId: post.author?._id,
  user: post.author ? {
    _id: post.author._id,
    id: post.author._id,
    name: post.author.name,
    email: post.author.email,
    role: post.author.role,
    profileImageUrl: post.author.profileImageUrl,
  } : undefined,
  caption: post.caption || '',
  media: Array.isArray(post.media) ? post.media : [],
  likes: Array.isArray(post.likes) ? post.likes.map((like: any) => like._id || like) : [],
  comments: Array.isArray(post.comments) ? post.comments.map((comment: any) => ({
    id: comment._id,
    userId: comment.user?._id,
    user: comment.user ? {
      _id: comment.user._id,
      id: comment.user._id,
      name: comment.user.name,
      email: comment.user.email,
      role: comment.user.role,
      profileImageUrl: comment.user.profileImageUrl,
    } : undefined,
    text: comment.content || '',
    createdAt: comment.createdAt,
  })) : [],
  createdAt: post.createdAt,
});

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  fetchPosts: (page?: number) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  createPost: (caption: string, mediaUris?: string[], mediaType?: 'image' | 'video', onProgress?: (progress: number) => void) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  
  fetchPosts: async (page = 1) => {
    // Check if user is authenticated before making API calls
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      console.log('FeedScreen - skipping fetchPosts, user not authenticated');
      return;
    }

    if (page === 1) {
      set({ isLoading: true, error: null });
    }
    
    try {
      console.log('Fetching posts, page:', page);
      const response = await api.getPosts(page, 20);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch posts');
      }

      if (!response.data || !Array.isArray(response.data.posts)) {
        console.error('Invalid posts response:', response);
        throw new Error('Invalid response format');
      }

      console.log('Posts fetched successfully:', {
        count: response.data.posts.length,
        hasMore: response.data.pagination?.hasNextPage
      });
      
      const transformedPosts: Post[] = response.data.posts.map(transformApiPost);

      if (page === 1) {
        set({ 
          posts: transformedPosts, 
          isLoading: false,
          currentPage: 1,
          hasMore: response.data.pagination?.hasNextPage || false,
          error: null
        });
      } else {
        set({ 
          posts: [...get().posts, ...transformedPosts],
          currentPage: page,
          hasMore: response.data.pagination?.hasNextPage || false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
        isLoading: false,
        hasMore: false
      });
    }
  },

  refreshPosts: async () => {
    await get().fetchPosts(1);
  },
  
  likePost: async (postId) => {
    try {
      const response = await api.likePost(postId);
      
      if (response.success) {
        const currentPosts = get().posts;
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser) {
          const updatedPosts = currentPosts.map(post => {
            if (post.id === postId) {
              const currentUserLiked = post.likes.includes(currentUser.id);
              const updatedLikes = currentUserLiked
                ? post.likes.filter(id => id !== currentUser.id)
                : [...post.likes, currentUser.id];
              
              return { ...post, likes: updatedLikes };
            }
            return post;
          });
          
          set({ posts: updatedPosts });
        }
      } else {
        throw new Error(response.message || 'Failed to like post');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to like post' 
      });
    }
  },
  
  addComment: async (postId, text) => {
    try {
      const response = await api.addComment(postId, text);
      
      if (response.success) {
        const currentPosts = get().posts;
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser) {
          const updatedPosts = currentPosts.map(post => {
            if (post.id === postId) {
              const newComment = {
                id: `${Date.now()}`,
                userId: currentUser.id,
                user: {
                  id: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                  role: currentUser.role,
                  profileImageUrl: currentUser.profileImageUrl,
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
        }
      } else {
        throw new Error(response.message || 'Failed to add comment');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add comment' 
      });
    }
  },
  
  createPost: async (caption, mediaUris, mediaType, onProgress) => {
    set({ isLoading: true, error: null });
    try {
      let response;
      if (mediaUris && mediaUris.length > 0) {
        response = await api.createPostWithMedia(caption, mediaUris, mediaType || 'image', onProgress);
      } else {
        response = await api.createPost({ caption });
      }
      if (response.data && response.data.success && response.data.data) {
        await get().refreshPosts();
        set({ isLoading: false });
      } else {
        throw new Error(response.data?.message || 'Failed to create post');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create post', isLoading: false });
    }
  },
}));