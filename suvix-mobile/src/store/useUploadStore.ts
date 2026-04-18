import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'failed';

interface UploadState {
  progress: number;
  status: UploadStatus;
  message: string;
  isVisible: boolean;
  uploadType: 'POST' | 'STORY'; // New field to distinguish progress UI
  
  // Actions
  startUpload: (mediaType: 'IMAGE' | 'VIDEO' | 'STORY', uploadType?: 'POST' | 'STORY') => void;
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

  startUpload: (mediaType, uploadType = 'POST') => {
    set({
      status: 'uploading',
      progress: 0,
      message: uploadType === 'STORY' ? `Adding to your Story...` : `Uploading ${mediaType.toLowerCase()}...`,
      isVisible: true,
      uploadType,
    });
  },

  updateProgress: (progress) => {
    const currentStatus = get().status;
    let message = get().message;

    const type = get().uploadType;

    if (currentStatus === 'processing') {
      message = type === 'STORY' ? `Optimizing story quality... ${progress}%` : `Optimizing media... ${progress}%`;
    } else if (currentStatus === 'uploading') {
      message = type === 'STORY' ? `Uploading to SuviX Story Engine... ${progress}%` : `Uploading to S3... ${progress}%`;
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
