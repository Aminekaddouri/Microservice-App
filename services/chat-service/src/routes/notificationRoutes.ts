import { FastifyInstance, RouteGenericInterface } from 'fastify';
import { authenticate } from '../middlewares/authenticate';
import { getNotificationsHandler, sendNotificationHandler, clearAllNotificationsHandler } from '../controllers/notificationController';

interface SendNotification extends RouteGenericInterface {
  Body: { content: string; type: string; receiversIds: string[] };
}

interface GetNotifications extends RouteGenericInterface {
  // No body
}

interface ClearAllNotifications extends RouteGenericInterface {
  // No body
}

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get<GetNotifications>('/me', { preHandler: authenticate }, getNotificationsHandler);
  fastify.post<SendNotification>('/', { preHandler: authenticate }, sendNotificationHandler);
  fastify.delete<ClearAllNotifications>('/clear-all', { preHandler: authenticate }, clearAllNotificationsHandler);
}