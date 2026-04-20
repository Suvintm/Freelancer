import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5052/api',
  withCredentials: true, // Crucial for HttpOnly cookies and sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for premium error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    
    // In a premium app, we would trigger a toast notification here
    console.error(`[API Error] ${message}`);
    
    return Promise.reject(error);
  }
);

export default api;
