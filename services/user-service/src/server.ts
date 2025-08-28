import Fastify from 'fastify';
import { initDb } from './database/init-db';
import { verifyToken } from './middlewares/verifyToken';
import { authenticate } from './middlewares/authenticate';
import userRoutes from './routes/userRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import profileRoutes from './routes/profileRoutes';
import themeRoutes from './routes/themeRoutes';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });

// ✅ Register cookie and CSRF (needed for profile/theme routes)
fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'your-super-secret-key',
  parseOptions: {}
});

fastify.register(csrf, {
  sessionPlugin: '@fastify/cookie',
  cookieOpts: {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// ✅ Decorate request with userId
fastify.decorateRequest('userId', '');

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

// Register routes
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(friendshipRoutes, { prefix: '/api/friendship' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(themeRoutes, { prefix: '/api/themes' });

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