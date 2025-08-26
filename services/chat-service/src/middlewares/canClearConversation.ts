import { FastifyRequest, FastifyReply } from 'fastify';
import { ClearConvParams } from '../types'; //*************//


export async function canClearConversation(
    request: FastifyRequest<{ Params: ClearConvParams }>,
    reply: FastifyReply
) {
    try {
        const { id, friendId } = request.params;
        const userId = request.userId;

        console.log('🔍 Checking clear conversation permission:', { id, friendId, userId });

        // Check if the requesting user is one of the participants
        if (userId !== id) {
            console.log('❌ User not authorized to clear this conversation');
            return reply.status(403).send({
                success: false,
                message: 'You are not authorized to clear this conversation'
            });
        }

        // Additional validation: Check if friendId exists and is valid
        if (!friendId || friendId === id) {
            console.log('❌ Invalid friend ID for conversation clearing');
            return reply.status(400).send({
                success: false,
                message: 'Invalid conversation participants'
            });
        }

        // You can add more checks here:
        // - Check if users are actually friends
        // - Check if conversation exists
        // - Check if user is not blocked

        console.log('✅ User authorized to clear conversation');
    } catch (error) {
        console.error('❌ Error in canClearConversation middleware:', error);
        return reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}