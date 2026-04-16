import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'failed';

interface UploadState {
  progress: number;
  status: UploadStatus;
  message: string;
  isVisible: boolean;
  
  // Actions
  startUpload: (mediaType: 'IMAGE' | 'VIDEO') => void;
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

  startUpload: (mediaType) => {
    set({
      status: 'uploading',
      progress: 0,
      message: `Uploading ${mediaType.toLowerCase()}...`,
      isVisible: true,
    });
  },

  updateProgress: (progress) => {
    const currentStatus = get().status;
    let message = get().message;

    if (currentStatus === 'processing') {
      message = `Optimizing media... ${progress}%`;
    } else if (currentStatus === 'uploading') {
      message = `Uploading to S3... ${progress}%`;
    }

    set({ progress, message });
  },

  setProcessing: () => {
    set({ 
      status: 'processing', 
      message: 'Processing in background...' 
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
