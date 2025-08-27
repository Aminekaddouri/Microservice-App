import Fastify from 'fastify';
import { initDb } from './database/init-db';
import { authenticate } from './middlewares/authenticate';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes'; // ✅ No braces
import cors from '@fastify/cors';
import { setupSocketHandlers } from './socket/socketHandler';
import { Server as SocketIOServer } from 'socket.io';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });

// ✅ Register both routes
fastify.register(messageRoutes, { prefix: '/api/messages' });
fastify.register(notificationRoutes, { prefix: '/api/notifications' }); // ✅ Correct prefix

fastify.get('/health', async (request, reply) => {
  return { success: true, message: 'Chat Service is running' };
});

const start = async () => {
  try {
    await initDb();
    const port = parseInt(process.env.PORT || '3003');
    await fastify.listen({ port, host: '0.0.0.0' });

    const io = new SocketIOServer(fastify.server, {
      cors: { origin: true }
    });
    setupSocketHandlers(io);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();