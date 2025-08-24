import Fastify from 'fastify';
import { initDb } from './database/init-db';
import { authenticate } from './middlewares/authenticate';
import messageRoutes from './routes/messageRoutes';
import cors from '@fastify/cors';
import { setupSocketHandlers } from './socket/socketHandler';

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, { origin: true });

// Register routes
fastify.register(messageRoutes, { prefix: '/api/messages' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { success: true, message: 'Chat Service is running' };
});

// Start server
const start = async () => {
  try {
    await initDb();
    const port = parseInt(process.env.PORT || '3003');
    await fastify.listen({ port, host: '0.0.0.0' });

    // Setup Socket.IO
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