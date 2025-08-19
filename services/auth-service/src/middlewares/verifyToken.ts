import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel"

export async function verifyToken(
    request: FastifyRequest & { userId: string },
    reply: FastifyReply,
): Promise<void> {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            reply.status(401).send({
                success: false,
                message: 'Messing or invalid token',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET)
            throw new Error('JWT_SECRET not defined');
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        if (!decoded.id) {
            {
                reply.status(401).send({
                    success: false,
                    message: 'Invalid user',
                });
                return;
            }
        }
        const user = await userModel.findUserById(decoded.id);
        if (!user) {
            reply.status(401).send({
                success: false,
                message: 'Invalid or expired token',
            });
            return;
        }
        request.userId = decoded.id;
    } catch (error) {
        // console.error('JWT Error:', error);
        return reply.status(401).send({
            success: false,
            message: 'Invalid or expired token',
        });
    }
}