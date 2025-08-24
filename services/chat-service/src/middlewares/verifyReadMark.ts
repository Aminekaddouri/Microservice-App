import { FastifyReply, FastifyRequest } from "fastify";
import messageModel, { Message } from "../models/messageModel";


export async function verifyReadMark(
    request: FastifyRequest<{
        Params: { msgId: string },
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const msgId = request.params.msgId;
        if (!msgId) {
            reply.status(404).send({ error: 'Missing message Id' });
            return;
        }
        const msg = await messageModel.getMsgById(msgId);
        if (!msg) {
            reply.status(404).send({ error: 'Message not exist' });
            return;
        }
        if (msg.readAt) {
            reply.status(400).send({ error: 'This message alread marked as read' });
            return;
        }
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: 'You can not mark this message as read' })
    }
}