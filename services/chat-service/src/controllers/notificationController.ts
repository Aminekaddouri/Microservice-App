import { FastifyRequest, FastifyReply } from "fastify";
import { getNotifications, sendNotification, clearAllNotifications } from "../models/notificationModel";

export async function getNotificationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const userId = request.userId;
    const notifs = await getNotifications(userId);
    reply.send({ success: true, notifs });
  } catch (error) {
    console.error(error);
    reply.status(500).send({ success: false, message: 'Failed to fetch notifications' });
  }
}

export async function sendNotificationHandler(
  request: FastifyRequest<{
    Body: { content: string; type: string; receiversIds: string[] };
  }>,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { content, type, receiversIds } = request.body;
    const senderId = request.userId;

    if (!content || !type || !receiversIds?.length) {
      return reply.status(400).send({ success: false, message: 'Invalid body' });
    }

    await sendNotification({
      senderID: senderId,
      content,
      type,
      receiversIDs: receiversIds
    });

    reply.send({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error(error);
    reply.status(500).send({ success: false, message: 'Failed to send notification' });
  }
}

export async function clearAllNotificationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const userId = request.userId;
    await clearAllNotifications(userId);
    reply.send({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error(error);
    reply.status(500).send({ success: false, message: 'Failed to clear notifications' });
  }
}