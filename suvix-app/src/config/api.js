import { Platform } from 'react-native';

// 10.0.2.2 is the special IP to reach your computer's localhost from Android Emulator
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5051/api' 
  : 'http://localhost:5051/api';

export const API_ENDPOINTS = {
  REELS_FEED: `${API_BASE_URL}/reels/feed`,
  AUTH_PROFILE: `${API_BASE_URL}/profile`,
};

export default API_BASE_URL;
