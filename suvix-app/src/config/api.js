import { Platform } from 'react-native';

/**
 * PRODUCTION-READY NETWORK CONFIG
 * 
 * We now use EXPO_PUBLIC_ environment variables.
 * This is the professional way to handle secrets in Expo.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5051/api'; 


export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  
  // Features
  REELS_FEED: `${API_BASE_URL}/reels/feed`,
  AUTH_PROFILE: `${API_BASE_URL}/profile`,
};

export default API_BASE_URL;
