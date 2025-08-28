import { FastifyRequest, FastifyReply } from "fastify";
import friendshipModel from '../models/friendshipModel';
import { FriendshipStatus } from '../types/FriendshipStatus';

async function addFriend(
    request: FastifyRequest<{ Body: { targetUserId: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const targetUserId = request.body.targetUserId;

        const existing = await friendshipModel.getFriendship(userId, targetUserId);
        if (existing) {
            reply.status(400).send({
                success: false,
                message: "Friendship or request already exists.",
            });
            return;
        }

        const friendship = await friendshipModel.createFriendRequest(userId, targetUserId);
        reply.status(201).send({
            success: true,
            message: "Friend request sent.",
            friendship: friendship
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: "Failed to add friend."
        });
    }
}

async function acceptFriend(
    request: FastifyRequest<{ Body: { targetUserId?: string; friendshipId?: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const { targetUserId, friendshipId } = request.body;

        let friendship;

        if (friendshipId) {
            // Accept by friendship ID (from notification click)
            console.log(`🤝 Accepting friend request by ID: ${friendshipId}`);
            friendship = await friendshipModel.acceptFriendRequestById(friendshipId, userId);
        } else if (targetUserId) {
            // Accept by target user ID (direct accept)
            console.log(`🤝 Accepting friend request from user: ${targetUserId}`);
            await friendshipModel.changeFriendshipStatus(userId, targetUserId, FriendshipStatus.Accepted);
            friendship = await friendshipModel.getFriendship(userId, targetUserId);
        } else {
            reply.status(400).send({
                success: false,
                message: "Either targetUserId or friendshipId is required.",
            });
            return;
        }

        // Emit socket event to notify the other user (simplified version)
        if (friendship) {
            // Determine who to notify (the other user in the friendship)
            let otherUserId: string;
            if (friendship.user1ID === userId) {
                otherUserId = friendship.user2ID;
            } else {
                otherUserId = friendship.user1ID;
            }

            // Use type assertion to access io property on server
            const io = (request.server as any).io;
            if (io) {
                io.to(otherUserId).emit('friend-request-accepted', {
                    friendId: userId,
                    message: 'Your friend request was accepted!'
                });
            }
        }

        reply.status(200).send({
            success: true,
            message: "Friend request accepted successfully.",
            friendship: friendship
        });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        
        // Handle specific error cases
        if (error instanceof Error && error.message.includes('not found')) {
            reply.status(404).send({
                success: false,
                message: error.message,
            });
        } else {
            reply.status(500).send({
                success: false,
                message: "Failed to accept friend request.",
            });
        }
    }
}

async function rejectFriend(
    request: FastifyRequest<{ Body: { targetUserId?: string; friendshipId?: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const { targetUserId, friendshipId } = request.body;

        if (friendshipId) {
            console.log(`❌ Rejecting friend request by ID: ${friendshipId}`);
            await friendshipModel.deleteFriendshipById(friendshipId, userId);
        } else if (targetUserId) {
            console.log(`❌ Rejecting friend request from user: ${targetUserId}`);
            await friendshipModel.deleteFriendship(userId, targetUserId);
        } else {
            reply.status(400).send({
                success: false,
                message: "Either targetUserId or friendshipId is required.",
            });
            return;
        }

        reply.status(200).send({
            success: true,
            message: "Friend request rejected successfully."
        });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        
        if (error instanceof Error && error.message.includes('not found')) {
            reply.status(404).send({
                success: false,
                message: error.message,
            });
        } else {
            reply.status(500).send({
                success: false,
                message: "Failed to reject friend request.",
            });
        }
    }
}

async function blockFriend(
    request: FastifyRequest<{ Body: { targetUserId: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const targetUserId = request.body.targetUserId;
        const friendship = await friendshipModel.changeFriendshipStatus(userId, targetUserId, FriendshipStatus.Blocked);
        reply.status(200).send({
            success: true,
            message: "User blocked.",
            friendship: friendship
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: "Failed to block user.",
        });
    }
}


async function unfriend(
    request: FastifyRequest<{ Body: { targetUserId: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const targetUserId = request.body.targetUserId;
        const friendship = await friendshipModel.deleteFriendship(userId, targetUserId);
        reply.status(200).send({
            success: true,
            message: "Friendship deleted.",
            friendship: friendship
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: "Failed to delete friendship.",
        });
    }
}

async function getFriendList(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const friends = await friendshipModel.getUserFriends(userId, FriendshipStatus.Accepted);
        reply.send({
            success: true,
            message: "Friend list fetched.",
            friendship: friends
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: "Failed to get friend list.",
        });
    }
}

async function getPendingRequests(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const pending = await friendshipModel.getUserFriends(userId, FriendshipStatus.Pending);
        reply.send({
            success: true,
            message: "Pending requests fetched.",
            pending: pending
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: "Failed to get pending requests.",
        });
    }
}

async function getBlockList(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        const friends = await friendshipModel.getUserFriends(userId, FriendshipStatus.Blocked);
        reply.send({
            success: true,
            message: "Friend list fetched.",
            friendship: friends
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: "Failed to get friend list.",
        });
    }
}


export default {
    addFriend,
    acceptFriend,
    rejectFriend,
    blockFriend,
    getBlockList,
    unfriend,
    getFriendList,
    getPendingRequests
};


