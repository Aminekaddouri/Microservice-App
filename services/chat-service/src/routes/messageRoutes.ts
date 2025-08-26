// services/chat-service/src/routes/messageRoutes.ts
import { FastifyInstance, RouteGenericInterface } from 'fastify';
import messageController from '../controllers/messageController';
import { authenticate } from '../middlewares/authenticate';
import { canSendMessage } from '../middlewares/canSendMessage';
import { verifyReadMark } from '../middlewares/verifyReadMark';
import { canDeleteMsg } from '../middlewares/canDeleteMsg';
import { canClearConversation } from '../middlewares/canClearConversation';
import { ClearConvParams } from '../types';
import { Message } from '../models/messageModel'; // Add this

/* this new route is complitly different from the one in the monolithic app*/

// Define route types
interface GetConvMessages extends RouteGenericInterface {
  Params: { id: string; friendId: string };
}

interface GetUserConversations extends RouteGenericInterface {
  Params: { id: string };
}

interface SendMessage extends RouteGenericInterface {
  Body: Omit<Message, 'id' | 'sentAt' | 'readAt'>; // ✅ Match controller
}

interface MarkMessageAsRead extends RouteGenericInterface {
  Params: { userId: string; msgId: string }; // ✅ Add userId
}

interface DeleteMessage extends RouteGenericInterface {
  Params: { msgId: string };
}

interface ClearConversation extends RouteGenericInterface {
  Params: ClearConvParams;
}

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.get<GetConvMessages>(
    '/:id/conv/:friendId',
    { preHandler: authenticate },
    messageController.getConvMessages
  );

  fastify.get<GetUserConversations>(
    '/:id/chat',
    { preHandler: authenticate },
    messageController.getUserConversations
  );

  fastify.post<SendMessage>(
    '/',
    { preHandler: [authenticate, canSendMessage] },
    messageController.sendMessage
  );

  fastify.patch<MarkMessageAsRead>(
    '/:msgId',
    { preHandler: [authenticate, verifyReadMark] },
    messageController.markMessageAsRead
  );

  fastify.delete<DeleteMessage>(
    '/:msgId',
    { preHandler: [authenticate, canDeleteMsg] },
    messageController.deleteMessage
  );

  fastify.delete<ClearConversation>(
    '/:id/conv/:friendId/clear',
    { preHandler: [authenticate, canClearConversation] },
    messageController.clearConversation
  );
}