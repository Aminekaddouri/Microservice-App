import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import userModel, { User } from '../models/userModel';
import verificaionModel, { Verification } from '../models/verificationModel';
import { generateJWT, generateSecureToken } from '../tools/tools';
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library';

async function registerUser(
    request: FastifyRequest<{
        Body: Omit<User, 'id' | 'verified' | 'joinedAt'>;
    }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const { fullName, nickName, email, picture, password } = request.body;

        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            reply.status(400).send(
                {
                    success: false,
                    message: 'User already exists with this email!'
                }
            );
            return;
        }

        const user = await userModel.registerUser({ fullName, nickName, email, picture, verified: false, password });

        const token = generateSecureToken();
        await verificaionModel.createVerification(user.id, token);
        const link = `${process.env.FRONT_DOMAIN_NAME}/verify-email?token=${token}&id=${user.id}`;
        await verificaionModel.sendVerificationEmail(user.email, link);
        // const { password: _, ...safeUser } = user;
        reply.send({
            success: true,
            message: 'User created successfully',
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send(
            {
                success: false,
                error: 'Failed to create user!',
            }
        );
    }
}

async function loginUser(
    request: FastifyRequest<{
        Body: {
            email: string,
            password: string,
        };
    }>,
    reply: FastifyReply
): Promise<void> {
    try {

        const email = request.body.email;
        const pass = request.body.password;
        const user = await userModel.loginUser(email, pass);
        if (!user) {
            reply.status(401).send(
                {
                    success: false,
                    message: 'Email or password incorrect',
                }
            );
            return;
        }
        const { password, ...safeUser } = user;
        const accessToken = generateJWT(user.id, process.env.ACCESS_TOKEN_EXP || '15m');
        const refreshToken = generateJWT(user.id, process.env.REFRESH_TOKEN_EXP || '7d');
        reply.send({
            success: true,
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: safeUser
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send(
            {
                success: false,
                message: 'Email or password incorrect',
            }
        );
    }
}

async function verify(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Invalid user',
            });
            return;
        }
        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(401).send({
                success: false,
                message: 'Invalid user',
            });
            return;
        }
        const { password: _, ...safeUser } = user;
        reply.send({
            success: true,
            user: user,
        });
    } catch (error) {
        console.error('Token verification error:', error);
        reply.status(401).send({
            success: false,
            message: 'Invalid token'
        });
    }
}

async function refresh(
    request: FastifyRequest<{
        Body: { refreshToken: string },
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const { refreshToken } = request.body;
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error('JWT_SECRET not defined');
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
        if (!decoded.id) {
            reply.code(401).send({
                success: false,
                message: 'Invalid refresh token payload',
            });
            return;
        }
        const newAccessToken = generateJWT(decoded.id, process.env.ACCESS_TOKEN_EXP || '15m');
        reply.send({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        reply.code(401).send({
            success: false,
            message: 'Invalid refresh token',
        });
    }
}

async function verifyEmail(
    request: FastifyRequest<{
        Querystring: {
            token: string,
            id: string,
        },
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const { token, id } = request.query;
        if (!token || !id) {
            reply.status(400).send({
                success: false,
                message: 'invalid',
            });
            return;
        }
        const user = await userModel.findUserById(id);
        if (!user) {
            reply.status(400).send({
                success: false,
                message: 'Invalid user',
            });
            return;
        }
        if (user.verified) {
            reply.send({
                success: false,
                message: 'already verified',
            });
            return;
        }
        const verification = await verificaionModel.findVerificationByUserId(id);
        if (!verification) {
            reply.status(400).send({
                success: false,
                message: 'Invalid or expired',
            });
            return;
        }
        const isMatch = await bcrypt.compare(token, verification.token);
        if (!isMatch) {
            reply.status(400).send({
                success: false,
                message: 'Invalid',
            });
            return;
        }

        const isExpired = new Date(verification.expiresAt) <= new Date();
        if (isExpired) {
            reply.status(400).send({
                success: false,
                message: 'expired',
            });
            return;
        }

        await userModel.markUserAsVerified(id);
        await verificaionModel.setVerificationDate(id);
        await verificaionModel.deleteExpiredVerifications();

        reply.send({
            success: true,
            message: 'verified',
        });

    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function isEmailVerified(
    request: FastifyRequest<{
        Querystring: { id: string }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const { id } = request.query;
        if (!id) {
            reply.status(400).send({
                success: false,
                message: 'invalid',
            });
            return;
        }
        const user = await userModel.findUserById(id);
        if (!user) {
            reply.status(400).send({
                success: false,
                message: 'invalid',
            });
            return;
        }
        if (!user.verified) {
            reply.send({
                success: true,
                verified: false,
                message: 'not verified',
            });
            return;
        }
        reply.send({
            success: true,
            verified: true,
            message: 'verified',
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
}
async function resendVerificationEmail(
    request: FastifyRequest<{
        Querystring: { id: string }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const { id } = request.query;
        if (!id) {
            reply.status(400).send({
                success: false,
                message: 'invalid',
            });
            return;
        }
        const user = await userModel.findUserById(id);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found',
            });
            return;
        }
        await verificaionModel.deleteExpiredVerifications();
        await verificaionModel.deleteVerification(id);

        const token = generateSecureToken();
        await verificaionModel.createVerification(user.id, token);
        const link = `${process.env.FRONT_DOMAIN_NAME}/verify-email?token=${token}&id=${user.id}`;

        await verificaionModel.sendVerificationEmail(user.email, link);
        reply.send({
            success: true,
            message: 'Verification email sent',
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
}

async function googleAuth(
    request: FastifyRequest<{
        Body: { token: string }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {

        const token = request.body.token;
        if (!token) {
            reply.status(400).send({
                success: false,
                message: 'invalid',
            });
            return;
        }
        const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID!
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return reply.status(401).send({
                success: false,
                message: 'Invalid token'
            });
        }

        const gogoleUser: User = {
            id: payload.sub,
            email: payload.email!,
            fullName: payload.name!,
            nickName: payload.name!,
            picture: payload.picture!,
            password: null,
            verified: true,
        };

        const result = await userModel.findUserByEmail(gogoleUser.email);
        let user: User;
        if (!result) {
            user = await userModel.registerUser(gogoleUser);
        } else {
            user = result;
        }

        const accessToken = generateJWT(user.id, process.env.ACCESS_TOKEN_EXP || '15m');
        const refreshToken = generateJWT(user.id, process.env.REFRESH_TOKEN_EXP || '7d');

        reply.send(
            {
                success: true,
                accessToken: accessToken,
                refreshToken: refreshToken,
                user: user
            }
        );

    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
}

export default {
    registerUser,
    loginUser,
    verify,
    refresh,
    verifyEmail,
    isEmailVerified,
    resendVerificationEmail,
    googleAuth,
};