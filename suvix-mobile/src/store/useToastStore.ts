import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

/**
 * 🍬 GLOBAL TOAST STORE
 * Controls the premium feedback popups across the app.
 */
export const useToastStore = create<ToastState>((set) => ({
  isVisible: false,
  message: '',
  type: 'success',

  showToast: (message, type = 'success') => {
    set({ isVisible: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      set({ isVisible: false });
    }, 4000);
  },

  hideToast: () => set({ isVisible: false }),
}));
