import { FastifyRequest, FastifyReply } from "fastify";
import messageModel, { Message } from "../models/messageModel"
import { ClearConvParams } from '../types'; //*************//


async function getConvMessages(
    request: FastifyRequest<{
        Params: {
            id: string,
            friendId: string,
        }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const { id, friendId } = request.params;
        if (!id || !friendId) {
            reply.status(404).send({ 
                success: false,
            message: 'User id or friend id not found!' });
            return;
        }
        const conv = await messageModel.getConvMessages(id, friendId);
        if (!conv || conv.length === 0) {
            reply.status(404).send({ 
                success: false,
            message: 'There is no conversation between those users!' });
            return;
        }
        reply.send(conv);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ 
            success: false,
            message: 'Failed to fetch conversation!' });
    }
}

async function getUserConversations(
    request: FastifyRequest<{
        Params: {
            id: string,
        }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const id = request.params.id;
        if (!id) {
            reply.status(404).send({ 
                success:false, 
                message:  'User id not found!' 
            });
            return;
        }
        const convs = await messageModel.getUserConversations(id);
        if (!convs || convs.length === 0) {
            reply.status(404).send({ 
                success:false, 
                message:  'There is no conversations for this user!' 
            });
            return;
        }
        reply.send({
            success:true, 
            convs:convs
    });
    } catch (error) {
        console.error(error);
        reply.status(500).send({ 
            success:false, 
            message:  'Failed to fetch conversations!' });
    }
}

async function sendMessage(
    request: FastifyRequest<{
        Body: Omit<Message, 'id' | 'sentAt' | 'readAt'> //*************//
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const msg = request.body;
        if (!msg) {
            reply.status(404).send({
                success:false, 
                message: 'Message not found!' 
            });
            return;
        }
        const newmsg = await messageModel.sendMessage(msg);
        if (!newmsg) {
            reply.status(500).send({ 
                success:false, 
                message:'Failed to send message!' 
            });
            return;
        }
        reply.status(201).send({
            success:true, 
            newmsg:newmsg
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({ 
            success:false, 
            message: 'Failed to send message!' 
        });
    }
}

async function markMessageAsRead(
    request: FastifyRequest<{
        Params: { userId: string; msgId: string };
    }>,
    reply: FastifyReply
): Promise<void> {
    const { msgId } = request.params;

    try {
        const updatedMessage = await messageModel.markMsgAsRead(msgId);
        if (!updatedMessage) {
            reply.status(500).send({ 
                success: false,
            message: 'Failed to update message!' });
            return;
        }
        reply.status(200).send({
            message: 'Message marked as read successfully.',
            updatedMessage,
        });
    } catch (error) {
        console.error('Failed to mark message as read:', error);
        reply.status(500).send({ 
            success: false,
            message: 'Failed to update message.' });
    }
}

async function deleteMessage(
    request: FastifyRequest<{
        Params: {
            msgId: string,
        }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const id = request.params.msgId;
        if (!id) {
            reply.status(404).send({ 
                success: false,
            message: 'User id not found!' });
            return;
        }
        const result = await messageModel.deleteMessage(id);
        if (result)
            reply.status(203).send({ 
            success: true, //*************//
            message: 'Message deleted successfully!' });
        else
            reply.status(500).send({ 
        success: false,
            message: 'Failed to delete message!' });
    } catch (error) {
        console.error(error);
        reply.status(500).send({ 
            success: false,
            message: 'Failed to delete message!' });
    }
}



async function clearConversation(
    request: FastifyRequest<{ Params: ClearConvParams }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const { id: userId, friendId } = request.params;
        const requestingUserId = request.userId;

        console.log('🗑️ Clearing conversation between:', { userId, friendId, requestingUserId });

        // Double-check authorization
        if (requestingUserId !== userId) {
            return reply.status(403).send({
                success: false,
                message: "Unauthorized to clear this conversation."
            });
        }

        // Delete all messages between these two users using your existing database setup
        const db = (request.server as any).db;
        
        // If you're using SQLite (based on your server setup)
        const deleteQuery = `
            DELETE FROM Message 
            WHERE (senderId = ? AND receiverId = ?) 
               OR (senderId = ? AND receiverId = ?)
        `;

        // Fix: Add explicit type annotation for 'this'
        const result = await new Promise<number>((resolve, reject) => {
            db.run(deleteQuery, [userId, friendId, friendId, userId], function(this: { changes: number }, err: any) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes || 0);
                }
            });
        });

        console.log(`🗑️ Cleared ${result} messages between users ${userId} and ${friendId}`);

        reply.send({
            success: true,
            message: `Conversation cleared successfully. ${result} messages deleted.`,
            deletedCount: result
        });

    } catch (error) {
        console.error('❌ Error clearing conversation1:', error);
        reply.status(500).send({
            success: false,
            message: "Failed to clear conversation."
        });
    }
}
async function clearConversationForUser(
    request: FastifyRequest<{ Params: ClearConvParams }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const { id: userId, friendId } = request.params;
        const requestingUserId = request.userId;

        console.log('🗑️ Clearing conversation for user:', { userId, friendId, requestingUserId });

        // For soft delete approach - you would need to modify your database schema
        // For now, return not implemented
        reply.send({
            success: false,
            message: "Soft delete not implemented. Use regular clear conversation instead."
        });

    } catch (error) {
        console.error('❌ Error clearing conversation for user:', error);
        reply.status(500).send({
            success: false,
            message: "Failed to clear conversation."
        });
    }
}

export default {
    getConvMessages,
    getUserConversations,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    clearConversation,
    clearConversationForUser
}