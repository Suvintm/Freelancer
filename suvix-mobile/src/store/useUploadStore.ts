import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'failed';

interface UploadState {
  progress: number;
  status: UploadStatus;
  message: string;
  isVisible: boolean;
  uploadType: 'POST' | 'STORY'; // New field to distinguish progress UI
  activeMediaId: string | null;
  
  // Actions
  startUpload: (mediaType: 'IMAGE' | 'VIDEO' | 'STORY', uploadType?: 'POST' | 'STORY') => void;
  setMediaId: (id: string) => void;
  updateProgress: (progress: number) => void;
  setProcessing: () => void;
  setSuccess: (message?: string) => void;
  setFailed: (error?: string) => void;
  reset: () => void;
}

/**
 * 🛰️ GLOBAL UPLOAD STORE
 * Manages the state for the integrated TopNavbar progress bar.
 */
export const useUploadStore = create<UploadState>((set, get) => ({
  progress: 0,
  status: 'idle',
  message: '',
  isVisible: false,
  uploadType: 'POST',
  activeMediaId: null,

  startUpload: (mediaType, uploadType = 'POST') => {
    set({
      status: 'uploading',
      progress: 0,
      activeMediaId: null, // Reset for new upload
      message: uploadType === 'STORY' ? `Adding to your Story...` : `Uploading ${mediaType.toLowerCase()}...`,
      isVisible: true,
      uploadType,
    });
  },

  setMediaId: (id) => set({ activeMediaId: id }),

  updateProgress: (progress) => {
    const currentStatus = get().status;
    let message = get().message;
    const type = get().uploadType;

    if (currentStatus === 'processing') {
      message = type === 'STORY' ? `SuviX Story Engine: Optimizing...` : `SuviX Media: Optimizing...`;
    } else if (currentStatus === 'uploading') {
      message = type === 'STORY' ? `Sending to Story Cloud...` : `Sending to Cloud...`;
    }

    set({ progress, message });
  },

  setProcessing: () => {
    set({ 
      status: 'processing', 
      message: 'Background Processing Started' 
    });
  },

  setSuccess: (message = 'Post Successful! ✅') => {
    set({ 
      status: 'success', 
      progress: 100, 
      message 
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      get().reset();
    }, 5000);
  },

  setFailed: (error = 'Upload failed') => {
    set({ 
      status: 'failed', 
      message: `Error: ${error} ❌` 
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      get().reset();
    }, 5000);
  },

  reset: () => {
    set({
      progress: 0,
      status: 'idle',
      message: '',
      isVisible: false,
    });
  },
}));
