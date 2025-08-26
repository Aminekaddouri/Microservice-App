import { Server as SocketIOServer } from 'socket.io';
import messageModel from '../models/messageModel';

interface SocketUser {
    userId: string;
    socketId: string;
    username: string;
}

const connectedUsers = new Map<string, SocketUser>();

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', async (socket) => { //*************//

    // Handle user joining
    socket.on('user-joined', async (data: { userId: string }) => {
      try {
        const userId = data.userId;
        if (!userId) {
          socket.emit('user-joined-error', { error: 'Missing userId' });
          return;
        }

        // Fetch user info from User Service
        const userRes = await fetch(`http://user-service:3002/api/users/${userId}`, {
          headers: {
            Authorization: socket.handshake.headers.authorization || '',
          },
        });

        if (!userRes.ok) {
          socket.emit('user-joined-error', { error: 'User not found' });
          return;
        }

        const { user } = await userRes.json();

        connectedUsers.set(socket.id, {
          userId: user.id,
          socketId: socket.id,
          username: user.fullName,
        });

        socket.join(`user_${user.id}`);

        socket.emit('user-joined-success', {
          userId: user.id,
          username: user.fullName,
        });

        // Broadcast updated online list
        const onlineUserIds = Array.from(connectedUsers.values()).map(u => u.userId);
        socket.emit('users-online', { userIds: onlineUserIds });
        socket.broadcast.emit('users-online', { userIds: onlineUserIds });

      } catch (error) {
        console.error('❌ Error in user-joined:', error);
        socket.emit('user-joined-error', { error: 'Failed to join' });
      }
    });
    // all the above is differnt from the monolothic one // 
    // ADD THIS HANDLER HERE - Handle private messages
    socket.on('send-private-message', async (data: {
        senderId: string;
        receiverId: string;
        content: string;
        senderName: string;
    }) => {
        try {
          // Save message to database first
          const savedMessage = await messageModel.sendMessage({
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content
          });
          if (savedMessage) {
              const messageData = {
                  id: savedMessage.id,
                  senderId: data.senderId,
                  receiverId: data.receiverId,
                  content: data.content,
                  sentAt: savedMessage.sentAt,
                  senderName: data.senderName
              };
              // Send to receiver's room
              socket.to(`user_${data.receiverId}`).emit('new-private-message', messageData);
              // Send confirmation back to sender
              socket.emit('message-sent-success', messageData);
          } else {
              socket.emit('message-sent-error', { error: 'Failed to save message' });
          }
        } catch (error) {
            socket.emit('message-sent-error', { error: 'Failed to deliver message' });
        }
    });

    socket.on('get-online-users', () => {
        const onlineUserIds = Array.from(connectedUsers.values()).map(user => user.userId);
        socket.emit('users-online', { userIds: onlineUserIds });
        console.log('📡 Server sent online users:', onlineUserIds);
    });

    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            console.log(`👋 User ${user.username} disconnected`);
            connectedUsers.delete(socket.id);
        } else {
            console.log('🔌 Socket disconnected:', socket.id);
        }
    });
  });
}