import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// API Configuration
const getApiBaseUrl = () => {
  // Use environment variable if available. This is the recommended approach.
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log(`Using API URL from environment: ${process.env.EXPO_PUBLIC_API_BASE_URL}`);
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Fallback for production
  if (!__DEV__) {
    console.warn('Production build is using a fallback API URL.');
    return 'https://your-production-api.com';
  }

  // Fallback for development.
  // This will work for web. For mobile development, you MUST create a .env file.
  if (Platform.OS === 'web') {
    console.log('Using http://localhost:5000 for web development.');
    return 'http://localhost:5000';
  } else {
    // This is a fallback and is unlikely to work.
    // Please create a .env file with your computer's local IP.
    console.warn('API URL is not set for mobile! Please create a .env file with EXPO_PUBLIC_API_BASE_URL.');
    return 'http://localhost:5000';
  }
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
        headers: { 'Content-Type': 'application/json' },
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

    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    };

    if (isFormData) {
      // Let fetch/browser set the Content-Type with the correct boundary for FormData
      delete headers['Content-Type'];
    } else if (options.body) {
      // For regular JSON requests, ensure Content-Type is set
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = { ...options, headers };

    try {
      console.log('Request config:', {
        url,
        method: config.method,
        headers: config.headers,
        bodyLength: typeof config.body === 'string' ? config.body.length : (config.body instanceof FormData ? 'FormData' : 0),
      });

      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      
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

      if (response.status === 429) {
        Alert.alert('Too Many Requests', 'You are making requests too quickly. Please wait a moment and try again.');
        throw new Error('Too many requests. Please slow down.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      if (!contentType || !contentType.includes('application/json')) {
        // For uploads, the response might not be JSON, handle gracefully
        if (response.status === 200 || response.status === 201) {
          return { success: true, message: 'Operation successful' } as ApiResponse<T>;
        }
        throw new Error('Invalid response format - expected JSON');
      }

      const data = await response.json();
      if (!data.success && data.message) {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Simplified public methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async put<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth API
  async signup(userData: any): Promise<ApiResponse<any>> {
    let endpoint = '/auth/signup';
    if (userData.role === 'student') endpoint = '/auth/student/register';
    else if (userData.role === 'alumni') endpoint = '/auth/alumni/register';
    return this.post(endpoint, userData);
  }

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.post('/auth/login', { email: email.trim(), password: password.trim() });
    if (response.success && response.data) {
      await setAuthToken(response.data.accessToken);
      await setRefreshToken(response.data.refreshToken);
    }
    return response;
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.post('/auth/logout');
    await removeTokens();
    return response;
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.get('/auth/me');
  }

  // User API
  async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/users/profile/${userId}`);
  }

  async updateUserProfile(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.put(`/users/profile/${userId}`, userData);
  }
  
  async uploadImage(endpoint: string, formData: FormData): Promise<ApiResponse<any>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await getAuthToken();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Do NOT set Content-Type for FormData
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Upload to ${endpoint} failed:`, error);
      throw error;
    }
  }

  async createPostWithMedia(caption: string, fileUris: string[], fileType: 'image' | 'video', onProgress?: (percent: number) => void): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('caption', caption);

    fileUris.forEach((uri) => {
      formData.append('media', {
        uri,
        name: `post_media_${Date.now()}.${fileType === 'image' ? 'jpg' : 'mp4'}`,
        type: `${fileType}/${fileType === 'image' ? 'jpeg' : 'mp4'}`,
      } as any);
    });
    
    // Note: The generic 'post' method was causing issues.
    // We are using a direct fetch call here, similar to what a dedicated upload function would do.
    return this.post('/posts', formData);
  }
  
  /**
   * This is the definitive file upload method, adapted from the project's original,
   * working post creation logic that uses XMLHttpRequest. This resolves the
   * "Network request failed" error by precisely mimicking a proven upload pattern.
   */
  async uploadFileWithXHR(endpoint: string, file: { uri: string, type: string, name: string }): Promise<ApiResponse<any>> {
    return new Promise(async (resolve, reject) => {
      const url = `${this.baseURL}${endpoint}`;
      const token = await getAuthToken();

      const formData = new FormData();
      formData.append('file', {
        // Apply the same platform-specific URI fix from the original post uploader
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        type: file.type,
        name: file.name,
      } as any);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      
      // Set ONLY the Authorization header, mirroring the working implementation.
      // Do NOT set 'Accept' or 'Content-Type'.
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const jsonResponse = JSON.parse(xhr.responseText);
            resolve(jsonResponse);
          } catch (e) {
            reject(new Error('Failed to parse server response.'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Server responded with status ${xhr.status}`));
          } catch(e) {
            reject(new Error(`Server responded with status ${xhr.status}: ${xhr.responseText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network request failed.'));
      };
      
      xhr.send(formData);
    });
  }

  async uploadProfileImage(formData: FormData): Promise<ApiResponse<any>> {
    const file = formData.get('file') as any;
    return this.uploadFileWithXHR('/users/upload/profile-image', file);
  }

  async uploadCoverImage(formData: FormData): Promise<ApiResponse<any>> {
    const file = formData.get('file') as any;
    return this.uploadFileWithXHR('/users/upload/cover-image', file);
  }

  // Posts API
  async getPosts(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.get(`/posts?page=${page}&limit=${limit}`);
  }

  async createPost(postData: any): Promise<ApiResponse<any>> {
    return this.post<any>('/posts', postData);
  }

  async deletePost(postId: string): Promise<ApiResponse<any>> {
    return this.delete<any>(`/posts/${postId}`);
  }

  async likePost(postId: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/posts/${postId}/like`);
  }
  
  async addComment(postId: string, content: string): Promise<ApiResponse<any>> {
    return this.post(`/posts/${postId}/comment`, { content });
  }

  // Queries API
  async getQueries(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.get(`/queries?page=${page}&limit=${limit}`);
  }

  async createQuery(queryData: any): Promise<ApiResponse<any>> {
    return this.post('/queries', queryData);
  }

  async addAnswer(queryId: string, answerData: any): Promise<ApiResponse<any>> {
    return this.put(`/queries/${queryId}/answer`, answerData);
  }

  // Connections API
  async sendConnectionRequest(requestData: any): Promise<ApiResponse<any>> {
    return this.post('/connections/request', requestData);
  }

  async acceptConnection(connectionId: string, responseMessage?: string): Promise<ApiResponse> {
    return this.put(`/connections/${connectionId}/accept`, { responseMessage });
  }

  async rejectConnection(connectionId: string, responseMessage?: string): Promise<ApiResponse> {
    return this.put(`/connections/${connectionId}/reject`, { responseMessage });
  }

  async disconnectConnection(connectionId: string): Promise<ApiResponse> {
    return this.post(`/connections/${connectionId}/disconnect`);
  }

  async getConnections(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.get(`/connections/user/${userId}?page=${page}&limit=${limit}`);
  }

  // Messages API
  async sendMessage(messageData: any): Promise<ApiResponse<any>> {
    return this.post('/messages/send', messageData);
  }

  async getConversation(userId: string, page = 1, limit = 50): Promise<PaginatedResponse<any>> {
    return this.get(`/messages/conversation/${userId}?page=${page}&limit=${limit}`);
  }

  async markConversationAsRead(userId: string): Promise<ApiResponse> {
    return this.post(`/messages/read/${userId}`);
  }

  async getUserPosts(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  }

  // Polls API
  async getActivePoll(): Promise<ApiResponse<any>> {
    return this.get('/polls/active');
  }
  async votePoll(pollId: string, optionId: string): Promise<ApiResponse<any>> {
    return this.post(`/polls/${pollId}/vote`, { optionId });
  }
  async getPollResults(pollId: string): Promise<ApiResponse<any>> {
    return this.get(`/polls/${pollId}/results`);
  }

  async searchUsers(query: string, role?: string, department?: string, limit = 20): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    if (role) params.append('role', role);
    if (department) params.append('department', department);
    return this.get(`/users/search?${params.toString()}`);
  }

  async getAllUsers(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    return this.get(`/users/all?${params.toString()}`, { method: 'GET' });
  }
}

// Create and export API instance
export const api = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { ApiResponse, PaginatedResponse }; 