import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * PRODUCTION-GRADE SECURITY
 * User data is in regular storage, but the JWT Token is in Hardware-Encrypted SecureStore.
 */
const TOKEN_KEY = 'suvix_auth_token';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await AsyncStorage.getItem('suvix_user_data');
      
      if (token && userData) {
        set({ 
          user: JSON.parse(userData), 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth Initialization Error:', error);
      set({ isLoading: false });
    }
  },

  setAuth: async (user, token) => {
    try {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (user) await AsyncStorage.setItem('suvix_user_data', JSON.stringify(user));
      set({ user, isAuthenticated: !!token });
    } catch (error) {
      console.error('Save Auth Error:', error);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await AsyncStorage.removeItem('suvix_user_data');
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout Error:', error);
    }
  },

  updateUser: async (userData) => {
    set((state) => {
      const newUser = { ...state.user, ...userData };
      AsyncStorage.setItem('suvix_user_data', JSON.stringify(newUser));
      return { user: newUser };
    });
  },
}));

export default useAuthStore;
