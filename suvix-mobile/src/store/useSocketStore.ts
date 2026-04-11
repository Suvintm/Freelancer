import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { router } from 'expo-router';
import { useAuthStore } from './useAuthStore';
import { api } from '../api/client';

export interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: async () => {
    // Prevent duplicate connections
    if (get().socket?.connected) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    // Use centralized resolver to keep Socket & API in sync (Local vs Prod)
    const { getResolvedBaseUrl } = require('../api/client');
    const socketUrl = await getResolvedBaseUrl();
    
    console.log(`📡 [SOCKET] Attempting connection to: ${socketUrl}`);

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'], // Use polling first for reliability in local dev
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('🔗 [SOCKET] Connected successfully -> ID:', socket.id);
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [SOCKET] Disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [SOCKET] Connection Error:', error.message);
    });


    // 🔒 [SECURITY] Session Invalidation Guard
    // Responds to the "Identity Guard" server-side kick.
    socket.on('session:invalidated', (data) => {
      console.warn('🚩 [SOCKET] Session invalidated by server:', data.reason);
      
      if (data.reason === 'Banned') {
        router.replace('/banned');
      } else {
        useAuthStore.getState().logout();
      }
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
      console.log('🔌 [SOCKET] Connection terminated securely.');
    }
  },
}));
