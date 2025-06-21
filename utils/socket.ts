import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from './api';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    // Prevent multiple connections
    if (this.socket) {
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('SocketService: No auth token found, cannot connect.');
      return;
    }
    
    console.log('SocketService: Attempting to connect...');
    
    // Connect to the base domain, not the /api path
    const socketUrl = API_BASE_URL.replace('/api', '');

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      // You might need these for React Native a metro bundler environment
      // transports: ['websocket'], // Let Socket.IO handle transport negotiation
    });

    this.socket.on('connect', () => {
      console.log('SocketService: Connected with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Disconnected. Reason:', reason);
      this.socket = null;
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection Error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export a singleton instance
export const socketService = new SocketService(); 