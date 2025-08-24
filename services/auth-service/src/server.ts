import Fastify, { FastifyRegister, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import dotenv from 'dotenv';
import './database/init-db';
import  db  from './database/db';
import { authRoutes } from './routes/authRoutes';
import cors from '@fastify/cors';
import { verifyToken } from './middlewares/verifyToken';

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

// Callback route
fastify.get('/api/auth/google/callback', async (req, reply) => {
  const token = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
  const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  }).then(res => res.json());

  // You can store userInfo in your DB or session here
  return reply.send(userInfo);
});


fastify.addHook('preHandler', async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const path = request.routeOptions?.url;
  const method = request.method;

  console.log("Path:", path, "Method:", method);

  const isPublic =
    (path === '/api/auth/login' && method === 'POST') ||
    (path === '/api/auth/register' && method === 'POST') ||
    (path === '/api/auth/refresh' && method === 'POST') ||
    (path === '/api/auth/google/callback' && method === 'POST') ||
    (path === '/api/auth/verify-email' && method === 'GET');
  console.log("is public:", isPublic);

  if (isPublic) return;

  await verifyToken(request, reply);
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