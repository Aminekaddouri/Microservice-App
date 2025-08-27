import { getCurrentUser } from '@/utils/authState';
import { isLoggedIn, getAccessToken, verifyToken } from '../utils/auth';
import { navigateTo } from "@/utils/router";
import io from 'socket.io-client';
import {online} from '../game-tools/online-game-tools';

export let socketNotification: any = null;

export function setNotification() {
  if (!isLoggedIn()) {
    // navigateTo('/');
    return ;
  }
  // start the socketNotification connection
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id)
    return ;
  
  // Disconnect existing socket if any
  if (socketNotification) {
    socketNotification.disconnect();
  }
  
  socketNotification = io('http://localhost:8081/notification', {
    auth: {
        token: getAccessToken(),
        userId: currentUser.id
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socketNotification.on('connect', () => {
    console.log('✅ Notification socket connected');
  });

  socketNotification.on('connect_error', async (err: any) => {
    console.error('🔌 Notification socket connection error:', err);
    if (err.message === 'Authentication error') {
      try {
        const ok = await verifyToken();
        if (ok) {
          const newToken = getAccessToken();
          socketNotification.auth.token = newToken;
          socketNotification.connect();
        } else {
          console.error('Token verification failed, redirecting to login');
          navigateTo('/');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        navigateTo('/');
      }
    }
  });

  socketNotification.on('disconnect', (reason: string) => {
    console.log('🔌 Notification socket disconnected:', reason);
  });

  socketNotification.on('tournament', (data: {type: string, message: string}) => {
    console.log('notification section');
    if (data.type === 'matchProposal') {
      console.log(data.message);
      online('tournament', '/tournament');
    } else {
      console.log(data);
    }
  });

  socketNotification.on('proposal:friendGame', () => {
    console.log('==========you have a friend game============');
    // socketNotification?.emit('proposal', 'declined');
    const gameInvitation = confirm('you have a friend game request');
    if (gameInvitation) {
      socketNotification?.emit('proposal', 'accepted');
      online('friend', '/chat');
    }
    else {
      socketNotification?.emit('proposal', 'declined');
    }
  });
}