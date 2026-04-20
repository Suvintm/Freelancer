import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  requiresMfa: boolean;
  mfaToken: string | null;
  
  setAuth: (user: User, accessToken: string) => void;
  setMfaRequired: (mfaToken: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      requiresMfa: false,
      mfaToken: null,

      setAuth: (user, accessToken) => set({ 
        user, 
        accessToken, 
        isAuthenticated: true, 
        requiresMfa: false, 
        mfaToken: null 
      }),

      setMfaRequired: (mfaToken, user) => set({ 
        mfaToken, 
        user, 
        requiresMfa: true, 
        isAuthenticated: false, 
        accessToken: null 
      }),

      logout: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false, 
        requiresMfa: false, 
        mfaToken: null 
      }),
    }),
    {
      name: 'suvix-admin-auth',
    }
  )
);
