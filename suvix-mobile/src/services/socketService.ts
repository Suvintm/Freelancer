import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import Constants from 'expo-constants';

/**
 * PRODUCTION-GRADE SOCKET SERVICE
 * Singleton for managing the real-time lifecycle of the app.
 * Mirroring the backend's socket.io (v4.8.1) configuration.
 */

class SocketService {
  private socket: Socket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  /**
   * Initialize and connect the socket
   * Uses the same dynamic URL resolver as the API client
   */
  public connect() {
    if (this.socket?.connected) return;

    // Resolve base URL (removing /api suffix if present)
    const env = process.env as any;
    const apiUrl = env.EXPO_PUBLIC_LOCAL_API_URL || env.EXPO_PUBLIC_PROD_API_URL || '';
    const socketUrl = apiUrl.replace(/\/api$/, '');

    const token = (useAuthStore.getState() as any).token;

    console.log(`🔌 [Socket] Connecting to ${socketUrl}...`);

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'], // Force websocket for performance
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.setupInternalListeners();
  }

  private setupInternalListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ [Socket] Connected successfully!');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ [Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('⚠️ [Socket] Connection Error:', err.message);
    });

    // Re-attach existing listeners if socket was recreated
    Object.keys(this.listeners).forEach((event) => {
      this.listeners[event].forEach((callback) => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  /**
   * Subscribe to a real-time event
   */
  public on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    this.socket?.on(event, callback as any);
  }

  /**
   * Unsubscribe from a real-time event
   */
  public off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
    this.socket?.off(event, callback as any);
  }

  /**
   * Emit an event to the server
   */
  public emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn(`⏳ [Socket] Not connected. Event '${event}' will be queued.`);
    }
    this.socket?.emit(event, data);
  }

  /**
   * Disconnect the socket manually (e.g. on logout)
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
