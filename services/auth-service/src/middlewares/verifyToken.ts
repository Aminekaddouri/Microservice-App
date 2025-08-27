import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import blacklistModel from "../models/blacklistModel";

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
        
        // Check if token is blacklisted
        const isBlacklisted = await blacklistModel.isTokenBlacklisted(token);
        if (isBlacklisted) {
            reply.status(401).send({
                success: false,
                message: 'Token has been revoked',
            });
            return;
        }
        
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET)
            throw new Error('JWT_SECRET not defined');
        
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, iat?: number, exp?: number };
        
        // Validate JWT payload structure and content
        if (!decoded || typeof decoded !== 'object') {
            reply.status(401).send({
                success: false,
                message: 'Invalid token payload',
            });
            return;
        }
        
        // Validate user ID exists and is a valid string
        if (!decoded.id || typeof decoded.id !== 'string' || decoded.id.trim().length === 0) {
            reply.status(401).send({
                success: false,
                message: 'Invalid user identifier',
            });
            return;
        }
        
        // Sanitize user ID (remove any potential injection characters)
        const sanitizedUserId = decoded.id.replace(/[^a-zA-Z0-9-_]/g, '');
        if (sanitizedUserId !== decoded.id) {
            reply.status(401).send({
                success: false,
                message: 'Invalid user identifier format',
            });
            return;
        }
        
        // Additional validation for token timestamps
        if (decoded.exp && decoded.exp <= Math.floor(Date.now() / 1000)) {
            reply.status(401).send({
                success: false,
                message: 'Token has expired',
            });
            return;
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