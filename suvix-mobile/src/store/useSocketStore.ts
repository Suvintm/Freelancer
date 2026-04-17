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

    // 📊 [MEDIA] Progress & Status Handlers
    socket.on('media:progress', (data: { mediaId: string; progress: number }) => {
      const { useUploadStore } = require('./useUploadStore');
      useUploadStore.getState().updateProgress(data.progress);
    });

    socket.on('media:status', async (data: { mediaId: string; status: string; error?: string; type?: string }) => {
      const { useUploadStore } = require('./useUploadStore');
      const Notifications = require('expo-notifications');

      if (data.status === 'READY') {
        useUploadStore.getState().setSuccess('Post Ready! ✅');
        
        // 🔔 [NOTIFICATION] Trigger local OS alert
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Success! 🎉",
            body: `Your ${data.type?.toLowerCase() || 'post'} is now live and ready to view.`,
            data: { mediaId: data.mediaId, type: 'MEDIA_READY' },
          },
          trigger: null, // show immediately
        });
      } else if (data.status === 'FAILED') {
        useUploadStore.getState().setFailed(data.error);
        
        // ⚠️ [NOTIFICATION] Notify user of failure
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Processing Failed ❌",
            body: "There was an issue optimizing your media. Please try again.",
            data: { mediaId: data.mediaId, type: 'MEDIA_FAILED' },
          },
          trigger: null,
        });
      } else if (data.status === 'PROCESSING') {
        useUploadStore.getState().setProcessing();
      }
    });

    // 👤 [IDENTITY] Surgical Profile Sync
    socket.on('user:profile_updated', (data: any) => {
      console.log('📡 [SOCKET] Surgical profile update received:', Object.keys(data));
      useAuthStore.getState().surgicallyUpdateUser(data);
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
