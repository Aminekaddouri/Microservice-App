import { FastifyRequest, FastifyReply } from "fastify";
import notificationModel, { Notification } from "../models/notificationModel";

async function getNotifications(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({ success: false,
            message: 'Unauthorized: User ID missing' });
            return;
        }
        const notifs = await notificationModel.getNotifications(userId);
        reply.send({
            success: true,
            notifs:notifs});
    } catch (error) {
        console.error(error);
        reply.status(500).send({ success: false,
            message: 'Failed to fetch notifications' });
    }
}

async function sendNotification(
    request: FastifyRequest<{
        Body: {
            content: string;
            type: string;
            receiversIds: string[];
        },
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const userId = request.userId;
        const { content, type, receiversIds } = request.body
        if (!userId) {
            reply.status(401).send({ 
                success: false,
                message: 'Unauthorized: User ID missing' });
            return;
        }
        if (!content || !type || receiversIds?.length === 0) {
            reply.status(400).send({ 
                success: false,
                message: 'Incomplete or invalid body' });
            return;
        }
        console.log("senderID: ", userId,
            "content: ",content,
            "type: ",type,
            "receiversIDs: ",receiversIds);
        await notificationModel.sendNotification({
            senderID: userId,
            content: content,
            type: type,
            receiversIDs: receiversIds,
        });
        reply.send({ 
            success: true,
            message: 'Notification sent' });
    } catch (error) {
        console.error(error);
        reply.status(500).send({ 
            success: false,
            message: 'Failed to send notification' });
    }
}

async function clearAllNotifications(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({ 
                success: false,
                message: 'Unauthorized: User ID missing' });
            return;
        }
        await notificationModel.clearAllNotifications(userId);
        reply.send({ 
            success: true,
            message: 'All notifications cleared' });
    } catch (error) {
        console.error(error);
        reply.status(500).send({ 
            success: false,
            message: 'Failed to clear notifications' });
    }
}

async function deleteNotification(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = (request as any).userId; // Ensure userId comes from auth middleware
        const notificationId = request.params.id;

        if (!userId) {
            return reply.status(401).send({
                success: false,
                message: 'Unauthorized: User ID missing',
            });
        }

        if (!notificationId) {
            return reply.status(400).send({
                success: false,
                message: 'Notification ID is required',
            });
        }

        // Delete notification by ID
        await notificationModel.deleteNotification(notificationId);

        return reply.status(200).send({
            success: true,
            message: 'Notification deleted successfully',
        });

    } catch (error) {
        console.error('Delete Notification Error:', error);
        return reply.status(500).send({
            success: false,
            message: 'Failed to delete notification',
        });
    }
}

export default {
    getNotifications,
    sendNotification,
    clearAllNotifications,
    deleteNotification
};