import { api } from '../client';
import type { SignupPayload } from '../../store/slices/authSlice';

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data; // { success, user, token, refreshToken, message }
  },

  signup: async (data: SignupPayload) => {
    let payload: Record<string, unknown> | FormData = data as unknown as Record<string, unknown>;
    
    // If a profile picture is provided, we must use FormData for multipart/form-data upload
    if (data.profilePicture instanceof File) {
      const formData = new FormData();
      Object.entries(data as unknown as Record<string, unknown>).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        if (key === 'youtubeChannels' || key === 'roleSubCategoryIds') {
          formData.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      payload = formData;
    }

    const res = await api.post('/auth/register-full', payload);
    return res.data; // { success, user, token, refreshToken, message }
  },

  logout: async (refreshToken: string) => {
    const res = await api.post('/auth/logout', { refreshToken });
    return res.data;
  },

  fetchMe: async () => {
    const res = await api.get('/auth/me');
    return res.data; // { success, user }
  },

  checkUsername: async (username: string) => {
    const res = await api.get(`/auth/check-username/${username}`);
    return res.data.available as boolean;
  },
};
