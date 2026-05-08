import { io } from 'socket.io-client';
import API_URL from '../config';

const SOCKET_URL = API_URL || `${window.location.protocol}//${window.location.hostname}:5005`;
let socket;
let isBfCacheListenerAdded = false;

export const initSocket = (user) => {
  if (socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL);

  socket.on('connect', () => {
    console.log('[Socket] Connected to server');
    if (user?.company_id) {
      socket.emit('join-company', user.company_id);
    }
    if (user?.id) {
      socket.emit('join-agent', user.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from server');
  });

  if (!isBfCacheListenerAdded) {
    // bfcache requires WebSockets to be closed
    window.addEventListener('pagehide', () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    // Reconnect when restored from bfcache
    window.addEventListener('pageshow', (event) => {
      if (event.persisted && socket && !socket.connected) {
        socket.connect();
      }
    });
    isBfCacheListenerAdded = true;
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
