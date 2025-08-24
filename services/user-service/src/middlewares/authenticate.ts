import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('JWT_SECRET not defined');

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    request.userId = decoded.id || decoded.id;

    console.log(`🔐 Authenticated user: ${request.userId}`);
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(401).send({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

export default authenticate;