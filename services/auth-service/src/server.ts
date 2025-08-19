import Fastify from 'fastify';
import path from 'path';
import dotenv from 'dotenv';
import './database/init-db';
import  db  from './database/db';
import { authRoutes } from './routes/authRoutes';
import cors from '@fastify/cors';

dotenv.config();

const fastify = Fastify({ logger: true });

// Decorate Fastify instance with DB
fastify.decorate('db', db);
fastify.decorateRequest('userId', '');

declare module 'fastify' {
  interface FastifyInstance {
    db: any;
  }
  interface FastifyRequest {
    userId: string;
  }
}

// Register CORS
fastify.register(cors, { origin: true });

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { success: true, message: 'Auth Service is running' };
});


// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();