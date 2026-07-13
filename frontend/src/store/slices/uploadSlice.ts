import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type UploadType = 'reel' | 'post' | 'youtube';
export type UploadStatus = 'uploading' | 'processing' | 'success' | 'failed';

export interface UploadJob {
  id: string;
  type: UploadType;
  status: UploadStatus;
  progress: number;
  message: string;
}

export interface UploadState {
  jobs: UploadJob[];
}

const initialState: UploadState = {
  jobs: [],
};

export const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addUpload: (state, action: PayloadAction<UploadJob>) => {
      // Ensure we don't add duplicate jobs
      const existing = state.jobs.find(j => j.id === action.payload.id);
      if (!existing) {
        state.jobs.unshift(action.payload); // Add to top of stack
      }
    },
    updateUploadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const job = state.jobs.find(j => j.id === action.payload.id);
      if (job) {
        job.progress = action.payload.progress;
      }
    },
    updateUploadStatus: (
      state,
      action: PayloadAction<{ id: string; status: UploadStatus; message?: string; progress?: number }>
    ) => {
      const job = state.jobs.find(j => j.id === action.payload.id);
      if (job) {
        job.status = action.payload.status;
        if (action.payload.message) job.message = action.payload.message;
        if (action.payload.progress !== undefined) job.progress = action.payload.progress;
      }
    },
    removeUpload: (state, action: PayloadAction<{ id: string }>) => {
      state.jobs = state.jobs.filter(j => j.id !== action.payload.id);
    },
  },
});

export const { addUpload, updateUploadProgress, updateUploadStatus, removeUpload } = uploadSlice.actions;

export const selectUploadJobs = (state: { upload: UploadState }) => state.upload.jobs;

export const uploadReducer = uploadSlice.reducer;
