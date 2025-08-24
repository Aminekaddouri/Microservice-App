import { FastifyReply, FastifyRequest } from "fastify";
import messageModel, { Message } from "../models/messageModel"

export async function canDeleteMsg(
    request: FastifyRequest<{
        Params: { msgId: string }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const userId = request.userId;
        const msgId = request.params.msgId;

        if (!userId || !msgId) {
            reply.status(400).send({ error: 'Missing token or message ID!' });
            return;
        }

        const msg = await messageModel.getMsgById(msgId);
        if (!msg) {
            reply.status(404).send({ error: 'Message not found!' });
            return;
        }

        if (msg.senderId !== userId) {
            reply.status(403).send({ error: 'Not allowed to delete this message' });
            return;
        }
    } catch (error) {
        reply.status(403).send({ error: 'Not allowed to delete this message' });
        return;
    }
}