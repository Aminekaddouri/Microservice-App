// chat-service/src/middlewares/canSendMessage.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { Message } from "../models/messageModel";

export async function canSendMessage(
  request: FastifyRequest<{
    Body: Omit<Message, "id" | "sentAt" | "readAt">;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { senderId, receiverId } = request.body;
    if (!senderId || !receiverId) {
      return reply.status(400).send({
        success: false,
        message: "Missing sender or receiver",
      });
    }

    // Call User Service to check friendship status
    const friendshipRes = await fetch(
      `http://user-service:3002/api/friendship/${senderId}/${receiverId}/status`,
      {
        headers: {
          Authorization: request.headers.authorization || "",
        },
      }
    );

    if (!friendshipRes.ok) {
      return reply.status(403).send({
        success: false,
        message: "Cannot send message: friendship check failed",
      });
    }

    const { status } = await friendshipRes.json();

    if (status !== "accepted") {
      return reply.status(403).send({
        success: false,
        message: "You cannot send messages to this user",
      });
    }
  } catch (error) {
    console.error("Error in canSendMessage:", error);
    reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
}