import Fastify, { FastifyRegister, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import dotenv from 'dotenv';
import './database/init-db';
import  db  from './database/db';
import { authRoutes } from './routes/authRoutes';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import { verifyToken } from './middlewares/verifyToken';
import { validateJWTEnvironment } from './tools/tools';

dotenv.config();

// Validate JWT configuration on startup
try {
  validateJWTEnvironment();
  console.log('✅ JWT environment validation passed');
} catch (error) {
  console.error('❌ JWT environment validation failed:', (error as Error).message);
  process.exit(1);
}

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

fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET,
  parseOptions: {}
});

// Register CSRF protection
fastify.register(csrf, {
  sessionPlugin: '@fastify/cookie',
  cookieOpts: {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
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

// CSRF token endpoint
fastify.get('/api/csrf-token', async (request, reply) => {
  const token = await reply.generateCsrf();
  return { csrfToken: token };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });


// Health check
fastify.get('/health', async (request, reply) => {
  return { success: true, message: 'Auth Service is running' };
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
    (path === '/api/auth/google' && method === 'POST') || // ✅ Fixed: GET
    (path === '/api/auth/verify-2fa' && method === 'POST') ||
    (path === '/api/auth/email-verification' && method === 'GET') ||
    (path === '/api/auth/resend-verification-email' && method === 'GET') ||
    (path === '/api/csrf-token' && method === 'GET'); // ✅ Added
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