import { FastifyInstance, FastifyPluginOptions, RouteGenericInterface } from "fastify";
import networkController from "../controllers/friendshipController";
import authenticate from "../middlewares/authenticate";

// Define route types
interface AddFriendRoute extends RouteGenericInterface {
  Body: { targetUserId: string };
}

interface AcceptFriendRoute extends RouteGenericInterface {
  Body: { targetUserId?: string; friendshipId?: string };
}

interface RejectFriendRoute extends RouteGenericInterface {
  Body: { targetUserId?: string; friendshipId?: string };
}

interface BlockFriendRoute extends RouteGenericInterface {
  Body: { targetUserId: string };
}

interface UnblockFriendRoute extends RouteGenericInterface {
  Body: { targetUserId: string };
}

async function userNetworkRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  fastify.get("/friend-list", { preHandler: authenticate }, networkController.getFriendList);
  fastify.get("/pending-requests", { preHandler: authenticate }, networkController.getPendingRequests);
  fastify.get("/block-list", { preHandler: authenticate }, networkController.getBlockList);

  // ✅ Already correct
  fastify.post<AddFriendRoute>(
    '/add-friend',
    { preHandler: authenticate },
    networkController.addFriend
  );

  // ✅ Fix: Add generic
  fastify.post<AcceptFriendRoute>(
    '/accept-friend',
    { preHandler: authenticate },
    networkController.acceptFriend
  );

  // ✅ Fix: Add generic
  fastify.post<UnblockFriendRoute>(
    '/unblock-friend',
    { preHandler: authenticate },
    networkController.unfriend
  );

  // ✅ Fix: Add generic
  fastify.post<BlockFriendRoute>(
    '/block-friend',
    { preHandler: authenticate },
    networkController.blockFriend
  );

  // ✅ Fix: Add generic
  fastify.post<AcceptFriendRoute>(
    '/accept',
    { preHandler: authenticate },
    networkController.acceptFriend
  );

  // ✅ Fix: Add generic
  fastify.post<RejectFriendRoute>(
    '/reject',
    { preHandler: authenticate },
    networkController.rejectFriend
  );
  
}

export default userNetworkRoutes;