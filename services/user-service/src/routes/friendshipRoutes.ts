import { FastifyInstance, FastifyPluginOptions, RouteGenericInterface } from "fastify";
import networkController from "../controllers/friendshipController";
import authenticate from "../middlewares/authenticate";

// Define the route type //*************//
interface AddFriendRoute extends RouteGenericInterface {
  Body: { targetUserId: string };
}

async function userNetworkRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  fastify.get("/friend-list", networkController.getFriendList);
  fastify.get("/pending-requests", networkController.getPendingRequests);
  fastify.get("/block-list", networkController.getBlockList);

  // ✅ Add generic to specify body type //***************//
  fastify.post<AddFriendRoute>(
    '/add-friend',
    { preHandler: authenticate },
    networkController.addFriend
  );

  fastify.post("/accept-friend", networkController.acceptFriend);
  fastify.post("/unblock-friend", networkController.unfriend);
  fastify.post("/block-friend", networkController.blockFriend);
  fastify.post('/accept', networkController.acceptFriend);
  fastify.post('/reject', networkController.rejectFriend);

  // Fix: Add preHandler to /status route //*************//
  fastify.get<{ Params: { userId: string; targetId: string } }>(
    '/:userId/:targetId/status',
    { preHandler: authenticate },
    networkController.getFriendshipStatus
  );
}

export default userNetworkRoutes;