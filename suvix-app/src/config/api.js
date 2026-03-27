import { Platform } from 'react-native';

/**
 * PRODUCTION-READY NETWORK CONFIG
 * 
 * 192.168.0.175 - Use your PC's local IP for Physical Device testing (Expo Go)
 * 10.0.2.2      - Android Emulator (Loopback to PC)
 * localhost     - iOS Simulator
 */
const LAN_IP = '192.168.0.175'; 

const API_BASE_URL = Platform.OS === 'android' 
  ? `http://${LAN_IP}:5051/api` 
  : `http://${LAN_IP}:5051/api`;

export const API_ENDPOINTS = {
  REELS_FEED: `${API_BASE_URL}/reels/feed`,
  AUTH_PROFILE: `${API_BASE_URL}/profile`,
};

export default API_BASE_URL;
