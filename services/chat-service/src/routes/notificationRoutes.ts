import { FastifyPluginOptions, FastifyInstance, RouteGenericInterface } from 'fastify';
import notificationController from '../controllers/notificationController';
import { authenticate } from '../middlewares/authenticate';

// Define route types
interface SendNotification extends RouteGenericInterface {
  Body: {
    content: string;
    type: string;
    receiversIds: string[];
  };
}

interface GetNotifications extends RouteGenericInterface {
  // No body, just auth
}

interface ClearAllNotifications extends RouteGenericInterface {
  // No body
}

interface DeleteNotification extends RouteGenericInterface {
  Params: {
    id: string;
  };
}

async function notificationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  fastify.post<SendNotification>(
    '/',
    { preHandler: authenticate },
    notificationController.sendNotification
  );

  fastify.get<GetNotifications>(
    '/me',
    { preHandler: authenticate },
    notificationController.getNotifications
  );

  fastify.delete<ClearAllNotifications>(
    '/clear-all',
    { preHandler: authenticate },
    notificationController.clearAllNotifications
  );

  fastify.delete<DeleteNotification>(
    '/:id',
    { preHandler: authenticate },
    notificationController.deleteNotification
  );
}

export default notificationRoutes;