import { FastifyInstance, FastifyPluginOptions } from "fastify";
import networkController from "../controllers/friendshipController"
import authenticate from "../middlewares/authenticate";

async function userNetworkRoutes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
): Promise<void> {
    fastify.get("/friend-list", networkController.getFriendList);
    fastify.get("/pending-requests", networkController.getPendingRequests);
    fastify.get("/block-list", networkController.getBlockList);

    fastify.post("/add-friend", networkController.addFriend);
    fastify.post("/accept-friend", networkController.acceptFriend);
    fastify.post("/unblock-friend", networkController.unfriend);
    fastify.post("/block-friend", networkController.blockFriend);
    fastify.post('/accept', networkController.acceptFriend);
    fastify.post('/reject', networkController.rejectFriend);
    fastify.get('/:userId/:targetId/status',{ preHandler: authenticate },networkController.getFriendshipStatus);
}

export default userNetworkRoutes;