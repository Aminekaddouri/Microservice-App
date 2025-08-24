import { FastifyInstance } from 'fastify';
import messageController from '../controllers/messageController';
import { authenticate } from '../middlewares/authenticate';
import { canSendMessage } from '../middlewares/canSendMessage';
import { verifyReadMark } from '../middlewares/verifyReadMark';
import { canDeleteMsg } from '../middlewares/canDeleteMsg';
import { canClearConversation } from '../middlewares/canClearConversation';

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.get('/:id/conv/:friendId', { preHandler: authenticate }, messageController.getConvMessages);
  fastify.get('/:id/chat', { preHandler: authenticate }, messageController.getUserConversations);
  fastify.post('/', { preHandler: [authenticate, canSendMessage] }, messageController.sendMessage);
  fastify.patch('/:msgId', { preHandler: [authenticate, verifyReadMark] }, messageController.markMessageAsRead);
  fastify.delete('/:msgId', { preHandler: [authenticate, canDeleteMsg] }, messageController.deleteMessage);
  fastify.delete('/:id/conv/:friendId/clear', { preHandler: [authenticate, canClearConversation] }, messageController.clearConversation);
}










////// this is different route than the monolithic one (check with mohammed) { preHandler: authenticate }