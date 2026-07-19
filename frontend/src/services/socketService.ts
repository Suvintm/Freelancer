import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket && currentToken === token) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
  let socketUrl = apiBase;
  try {
    socketUrl = new URL(apiBase).origin;
  } catch {
    socketUrl = apiBase.replace(/\/api(\/v1)?$/, '');
  }

  socket = io(socketUrl, {
    auth: { token },
    autoConnect: true,
  });

  currentToken = token;
  console.log('📡 [socketService] Initialized new Socket.io connection');
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
    console.log('📡 [socketService] Disconnected Socket.io connection');
  }
};
