import { FastifyInstance, FastifyRequest, FastifyReply, RouteHandlerMethod } from 'fastify';
import {
  updateProfile,
  changePassword,
  generate2FA,
  enable2FA,
  disable2FA,
  verify2FA,
  syncGoogleProfile,
  getProfile
} from '../controllers/profileController';
import { verifyToken } from '../middlewares/verifyToken';

export default async function profileRoutes(fastify: FastifyInstance) {
  // Get profile
  fastify.get('/profile', { preHandler: verifyToken }, getProfile);
  
  // Update profile
  fastify.put('/profile', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, updateProfile as RouteHandlerMethod);
  
  // Change password
  fastify.put('/profile/password', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, changePassword as RouteHandlerMethod);
  
  // 2FA routes
  fastify.post('/profile/2fa/setup', {
    preHandler: [verifyToken]
  }, generate2FA as RouteHandlerMethod);
  
  fastify.post('/profile/2fa/enable', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, enable2FA as RouteHandlerMethod);
  
  fastify.post('/profile/2fa/disable', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, disable2FA as RouteHandlerMethod);
  
  fastify.post('/profile/2fa/verify', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, verify2FA as RouteHandlerMethod);
  
  // Google sync
  fastify.post('/profile/sync-google', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, syncGoogleProfile as RouteHandlerMethod);
}