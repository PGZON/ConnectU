import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration
const getApiBaseUrl = () => {
  // Use environment variable if available.
  // This is the recommended approach for configuring the API URL.
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Fallback for production
  if (!__DEV__) {
    return 'https://your-production-api.com';
  }

  // Fallback for development.
  // This will work for web. For mobile development, you MUST create a .env file
  // with `EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:5000`
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('Running on platform:', Platform.OS);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('EXPO_PUBLIC_API_BASE_URL from env:', process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('Is in dev mode:', __DEV__);

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Token Management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

const removeTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};

// API Client
class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });

    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      await setAuthToken(data.data.accessToken);
      await setRefreshToken(data.data.refreshToken);
      return data.data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await removeTokens();
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await getAuthToken();

    console.log('Making API request to:', url);

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Request config:', {
        url,
        method: config.method,
        headers: config.headers,
        bodyLength: typeof config.body === 'string' ? config.body.length : 0
      });

      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      
      // Handle token expiration
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
        
        if (errorData.code === 'TOKEN_EXPIRED' && !this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ 
              resolve: (token: string) => {
                // We need to re-make the original request with the new token
                // and resolve the outer promise with its result.
                const newOptions = { ...options };
                if (newOptions.headers) {
                  (newOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                } else {
                  newOptions.headers = { 'Authorization': `Bearer ${token}` };
                }
                resolve(this.request(endpoint, newOptions));
              }, 
              reject 
            });

            if (!this.isRefreshing) {
              this.isRefreshing = true;

              this.refreshAccessToken()
                .then(newToken => {
                  this.isRefreshing = false;
                  if (newToken) {
                    this.processQueue(null, newToken);
                    // Retry the original request with new token
                    return this.request(endpoint, options);
                  } else {
                    this.processQueue(new Error('Failed to refresh token'));
                    throw new Error('Failed to refresh token');
                  }
                })
                .catch(error => {
                  this.isRefreshing = false;
                  this.processQueue(error);
                  throw error;
                });
            }
          });
        }
        
        throw new Error(errorData.message || 'Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP error! status: ${response.status}` 
        }));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format - expected JSON');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth API
  async signup(userData: any): Promise<ApiResponse<any>> {
    let endpoint = '/auth/signup';
    if (userData.role === 'student') {
      endpoint = '/auth/student/register';
    } else if (userData.role === 'alumni') {
      endpoint = '/auth/alumni/register';
    }
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      console.log('Attempting login for email:', email);
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        await setAuthToken(accessToken);
        await setRefreshToken(refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    await removeTokens();
    return response;
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  // User API
  async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/profile/${userId}`);
  }

  async updateUserProfile(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/users/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUsersByRole(role: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request(`/users/role/${role}?page=${page}&limit=${limit}`);
  }

  // Posts API
  async getPosts(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request(`/posts?page=${page}&limit=${limit}`);
  }

  async getPost(postId: string): Promise<ApiResponse<any>> {
    return this.request(`/posts/${postId}`);
  }

  async createPost(postData: any): Promise<ApiResponse<any>> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likePost(postId: string): Promise<ApiResponse> {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async addComment(postId: string, content: string): Promise<ApiResponse> {
    return this.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Queries API
  async getQueries(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request(`/queries?page=${page}&limit=${limit}`);
  }

  async createQuery(queryData: any): Promise<ApiResponse<any>> {
    return this.request('/queries', {
      method: 'POST',
      body: JSON.stringify(queryData),
    });
  }

  // Connections API
  async sendConnectionRequest(requestData: any): Promise<ApiResponse<any>> {
    return this.request('/connections/request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async acceptConnection(connectionId: string, responseMessage?: string): Promise<ApiResponse> {
    return this.request(`/connections/${connectionId}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ responseMessage }),
    });
  }

  async rejectConnection(connectionId: string, responseMessage?: string): Promise<ApiResponse> {
    return this.request(`/connections/${connectionId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ responseMessage }),
    });
  }

  async disconnectConnection(connectionId: string): Promise<ApiResponse> {
    return this.request(`/connections/${connectionId}/disconnect`, {
      method: 'POST',
    });
  }

  async getConnections(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request(`/connections/user/${userId}?page=${page}&limit=${limit}`);
  }

  // Messages API
  async sendMessage(messageData: any): Promise<ApiResponse<any>> {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getConversation(userId: string, page = 1, limit = 50): Promise<PaginatedResponse<any>> {
    return this.request(`/messages/conversation/${userId}?page=${page}&limit=${limit}`);
  }

  async markConversationAsRead(userId: string): Promise<ApiResponse> {
    return this.request(`/messages/conversation/${userId}/read`, {
      method: 'PUT',
    });
  }

  // Add this to the ApiClient class
  async createPostWithMedia(caption: string, fileUri: string, fileType: 'image' | 'video', onProgress?: (percent: number) => void): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('caption', caption);
    if (fileUri) {
      const filename = fileUri.split('/').pop() || `media.${fileType === 'video' ? 'mp4' : 'jpg'}`;
      const type = fileType === 'video' ? 'video/mp4' : 'image/jpeg';
      formData.append('media', {
        uri: fileUri,
        name: filename,
        type,
      } as any);
    }
    const token = await getAuthToken();
    return new Promise<ApiResponse<any>>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseURL}/posts`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Do NOT set Content-Type header manually for FormData with XHR
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          // Ensure the response is always an ApiResponse
          resolve({
            success: json.success ?? true,
            message: json.message ?? '',
            data: json.data ?? json,
            errors: json.errors ?? [],
            timestamp: json.timestamp ?? new Date().toISOString(),
          });
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }
      xhr.send(formData);
    });
  }

  async getUserPosts(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  }

  // Polls API
  async getActivePoll(): Promise<ApiResponse<any>> {
    return this.request('/polls/active');
  }
  async votePoll(pollId: string, optionId: string): Promise<ApiResponse<any>> {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  }
  async getPollResults(pollId: string): Promise<ApiResponse<any>> {
    return this.request(`/polls/${pollId}/results`);
  }

  async searchUsers(query: string, role?: string, department?: string, limit = 20): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    if (role) params.append('role', role);
    if (department) params.append('department', department);
    return this.request(`/users/search?${params.toString()}`);
  }

  async getAllUsers(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    return this.request(`/users/all?${params.toString()}`, { method: 'GET' });
  }
}

// Create and export API instance
export const api = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { ApiResponse, PaginatedResponse }; 