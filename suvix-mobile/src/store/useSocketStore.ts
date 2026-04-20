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
    socket.off('session:invalidated');
    socket.on('session:invalidated', (data) => {
      console.warn('🚩 [SOCKET] Session invalidated by server:', data.reason);
      
      if (data.reason === 'Banned') {
        router.replace('/banned');
      } else {
        useAuthStore.getState().logout();
      }
    });

    // 📊 [MEDIA] Progress & Status Handlers (Centralized)
    socket.off('media:progress');
    socket.on('media:progress', (data: { mediaId: string; progress: number }) => {
      const { useUploadStore } = require('./useUploadStore');
      useUploadStore.getState().updateProgress(data.progress);
    });

    socket.off('media:status');
    socket.on('media:status', async (data: { mediaId: string; status: string; error?: string; type?: string }) => {
      const { useUploadStore } = require('./useUploadStore');
      const { useToastStore } = require('./useToastStore');
      const { queryClient } = require('../../app/_layout');
      const { api } = require('../api/client');
      const Notifications = require('expo-notifications');

      console.log(`🏁 [SOCKET] Global Media Status: ${data.status} for ${data.mediaId}`);

      if (data.status === 'READY') {
        useUploadStore.getState().setSuccess('Upload complete! ✅');
        
        // 🍬 [TOAST] Show premium popup feedback
        useToastStore.getState().showToast('Post Live! 🎉', 'success');

        // 🔄 [AUTO-REFRESH] Invalidate profile and feed queries
        queryClient.invalidateQueries({ queryKey: ['profilePosts'] });
        queryClient.invalidateQueries({ queryKey: ['profileReels'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });

        // 🔔 [NOTIFICATION] Backup System Alert
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Post Live! 🎉",
            body: `Your ${data.type?.toLowerCase() || 'content'} is now ready to view.`,
            data: { mediaId: data.mediaId, type: 'MEDIA_READY' },
          },
          trigger: null,
        });
      } else if (data.status === 'FAILED') {
        useUploadStore.getState().setFailed('Upload failed. You can re-upload the story.');
        useToastStore.getState().showToast('Story Failed ❌', 'error');
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Upload Failed ❌",
            body: data.error || "Something went wrong during processing.",
          },
          trigger: null,
        });
      } else if (data.status === 'PROCESSING') {
        useUploadStore.getState().setProcessing();
        useUploadStore.getState().setMediaId(data.mediaId);

        // 🛡️ [STATE-RESOLVER] Backup mechanism for lost socket signals
        // If we don't hear 'READY' or 'FAILED' within 15s, manually poll the status once.
        setTimeout(async () => {
          const currentStatus = useUploadStore.getState().status;
          const activeId = useUploadStore.getState().activeMediaId;
          
          if (currentStatus === 'processing' && activeId === data.mediaId) {
            console.log('📡 [RESOLVER] Socket signal delayed. Manually polling status for:', data.mediaId);
            try {
              const res = await api.get(`/media/${data.mediaId}/status`);
              if (res.data.success && res.data.status === 'READY') {
                console.log('✅ [RESOLVER] Media actually READY. Force-completing UI.');
                useUploadStore.getState().setSuccess('Post Ready! ✅');
                useToastStore.getState().showToast('Post Live! 🎉', 'success');
                queryClient.invalidateQueries({ queryKey: ['profilePosts'] });
              }
            } catch (err) {
              console.error('❌ [RESOLVER] Manual status check failed:', err);
            }
          }
        }, 15000);
      }
    });

    // 🎥 [STORY] Progress & Status Handlers
    socket.off('story:progress');
    socket.on('story:progress', (data: { mediaId: string; progress: number }) => {
      const { useUploadStore } = require('./useUploadStore');
      // Story processing is often faster, but we still update the UI
      useUploadStore.getState().updateProgress(data.progress);
    });

    socket.off('story:status');
    socket.on('story:status', async (data: { mediaId: string; status: string; error?: string }) => {
      const { useUploadStore } = require('./useUploadStore');
      const { useToastStore } = require('./useToastStore');
      const { queryClient } = require('../../app/_layout');

      console.log(`🏁 [SOCKET] Story Status: ${data.status} for ${data.mediaId}`);

      if (data.status === 'READY') {
        useUploadStore.getState().setSuccess('Story uploaded successfully! 🔥');
        useToastStore.getState().showToast('Story Live! 📸', 'success');
        
        // Refresh stories
        queryClient.invalidateQueries({ queryKey: ['storyFeed'] });
        queryClient.invalidateQueries({ queryKey: ['activeStories'] });
        
      } else if (data.status === 'FAILED') {
        useUploadStore.getState().setFailed('Upload failed. You can re-upload the story.');
        useToastStore.getState().showToast('Story Failed ❌', 'error');
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
