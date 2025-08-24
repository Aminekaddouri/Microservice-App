import Fastify from 'fastify';
import { initDb } from './database/init-db';
import { authenticate } from './middlewares/authenticate';
import userRoutes from './routes/userRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });

// Register routes
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(friendshipRoutes, { prefix: '/api/friendship' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { success: true, message: 'User Service is running' };
});

// Start server
const start = async () => {
  try {
    await initDb();
    const port = parseInt(process.env.PORT || '3002');
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();