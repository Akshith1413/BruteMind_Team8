/**
 * socketClient.js — Cortex OS Real-Time Communication Layer
 * Wraps socket.io-client as a lazy singleton so every component
 * shares the same underlying WebSocket connection.
 */
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

/** Return (or create) the shared socket instance. Does NOT auto-connect. */
export const getSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Cortex Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Cortex Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Cortex Socket] Connection error:', err.message);
    });
  }
  return socket;
};

/** Connect the socket (safe to call repeatedly). */
export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

/** Gracefully disconnect if connected. */
export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
