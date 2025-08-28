import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import userModel, { User } from '../models/userModel';
import verificaionModel, { Verification } from '../models/verificationModel';
import { generateJWT, generateSecureToken } from '../tools/tools';
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library';
import blacklistModel from '../models/blacklistModel';
import speakeasy from 'speakeasy';

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
        const link = `${process.env.FRONT_DOMAIN_NAME}/check-your-email?token=${token}&id=${user.id}`;
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
        const user = await userModel.findUserByEmail(email);
        if (!user || !await bcrypt.compare(pass, user.password || '')) {
            reply.status(401).send(
                {
                    success: false,
                    message: 'Email or password incorrect',
                }
            );
            return;
        }

        // ✅ Sync user BEFORE sending response //**********************//
        try {
            const syncResponse = await fetch('http://user-service:3002/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    fullName: user.fullName,
                    nickName: user.nickName,
                    email: user.email,
                    picture: user.picture,
                    verified: user.verified,
                    isGoogleUser: user.isGoogleUser,
                    twoFactorEnabled: user.twoFactorEnabled,
                    twoFactorSecret: user.twoFactorSecret,
                    twoFactorBackupCodes: user.twoFactorBackupCodes,
                    joinedAt: user.joinedAt
                })
            });

            if (!syncResponse.ok) {
                console.error('Failed to sync user:', await syncResponse.text());
            } else {
                console.log('✅ User synced to user-service');
            }
        } catch (syncError) {
            console.error('Error syncing user:', syncError);
            // Don't block login — just log
        }

        if (user.twoFactorEnabled) {
            const JWT_SECRET = process.env.JWT_SECRET;
            if (!JWT_SECRET) throw new Error('JWT_SECRET not defined');
            const tempToken = jwt.sign({ id: user.id, pending2fa: true }, JWT_SECRET, { expiresIn: '5m' });
            reply.send({
                success: true,
                pending2fa: true,
                tempToken
            });
            return;
        }

        // ✅ Now send login response
        const { password, ...safeUser } = user;
        const accessToken = generateJWT(user.id, process.env.ACCESS_TOKEN_EXP || '15m');
        const refreshToken = generateJWT(user.id, process.env.REFRESH_TOKEN_EXP || '7d');

        // Set refresh token as secure HTTP-only cookie
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: '/'
        });

        reply.send({
            success: true,
            accessToken: accessToken,
            user: safeUser
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: 'Email or password incorrect',
        });
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
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    try {
        const refreshToken = request.cookies.refreshToken;
        
        if (!refreshToken) {
            reply.code(401).send({
                success: false,
                message: 'Refresh token not found',
            });
            return;
        }
        
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
        const newRefreshToken = generateJWT(decoded.id, process.env.REFRESH_TOKEN_EXP || '7d');
        
        // Set new refresh token as secure HTTP-only cookie
        reply.setCookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: '/'
        });
        
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
        const link = `${process.env.FRONT_DOMAIN_NAME}/check-your-email?token=${token}&id=${user.id}`;
        console.log('new link= : ', link);

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
        Body: { code?: string; codeVerifier?: string; token?: string }
    }>,
    reply: FastifyReply,
): Promise<void> {
    try {
        const { code, codeVerifier, token } = request.body;
        const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        let payload;

        if (token) {
            // Handle ID token (implicit flow)
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID!,
            });
            payload = ticket.getPayload();
        } else if (code) {
            // Handle authorization code flow with PKCE
            const tokenParams: any = {
                code,
                redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000',
            };
            if (codeVerifier) {
                tokenParams.codeVerifier = codeVerifier;
            }
            const { tokens } = await googleClient.getToken(tokenParams);

            const ticket = await googleClient.verifyIdToken({
                idToken: tokens.id_token!,
                audience: process.env.GOOGLE_CLIENT_ID!,
            });
            payload = ticket.getPayload();
        } else {
            reply.status(400).send({
                success: false,
                message: 'Missing authorization code or token',
            });
            return;
        }

        if (!payload) {
            return reply.status(401).send({
                success: false,
                message: 'Invalid token',
            });
        }

        const googleUser: User = {
            id: payload.sub,
            email: payload.email!,
            fullName: payload.name!,
            nickName: payload.name!,
            picture: payload.picture!,
            password: null,
            verified: true,
            isGoogleUser: true,
        };

        const result = await userModel.findUserByEmail(googleUser.email);
        let user: User;
        if (!result) {
            user = await userModel.registerUser(googleUser);
        } else {
            let updatedUser = result;
            // Update existing user to mark as Google user if not already set
            if (!result.isGoogleUser) {
                await userModel.updateUserById(result.id, { isGoogleUser: true });
                updatedUser = { ...result, isGoogleUser: true } as User;
            }
            // Ensure Google-linked accounts are marked verified
            if (!updatedUser.verified) {
                await userModel.markUserAsVerified(updatedUser.id);
                updatedUser = { ...updatedUser, verified: true } as User;
            }
            user = updatedUser;
        }

        // If user has 2FA enabled, return a temp token and require 2FA verification
        if (user.twoFactorEnabled) {
            const JWT_SECRET = process.env.JWT_SECRET;
            if (!JWT_SECRET) throw new Error('JWT_SECRET not defined');
            const tempToken = jwt.sign({ id: user.id, pending2fa: true }, JWT_SECRET, { expiresIn: '5m' });
            reply.send({
                success: true,
                pending2fa: true,
                tempToken,
            });
            return;
        }

        const accessToken = generateJWT(user.id, process.env.ACCESS_TOKEN_EXP || '15m');
        const refreshToken = generateJWT(user.id, process.env.REFRESH_TOKEN_EXP || '7d');
        
        // Set refresh token as secure HTTP-only cookie
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: '/'
        });

        reply.send({
            success: true,
            accessToken: accessToken,
            user: user
        });
    } catch (error) {
        console.error(error);
        reply.status(500).send({
            success: false,
            message: 'Authentication failed: ' + (error as Error).message,
        });
    }
}

async function logout(
    request: FastifyRequest & { userId: string },
    reply: FastifyReply
): Promise<void> {
    try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const JWT_SECRET = process.env.JWT_SECRET;
            
            if (JWT_SECRET) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, exp: number };
                    const expiresAt = new Date(decoded.exp * 1000);
                    
                    // Add token to blacklist
                    await blacklistModel.addToBlacklist(token, decoded.id, expiresAt);
                    
                    // Clean up expired tokens periodically
                    await blacklistModel.cleanupExpiredTokens();
                } catch (jwtError) {
                    // Token is invalid, but we still want to confirm logout
                    console.log('Invalid token during logout:', jwtError);
                }
            }
        }
        
        // Clear refresh token cookie
        reply.clearCookie('refreshToken', {
            path: '/'
        });
        
        reply.send({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        reply.status(500).send({
            success: false,
            message: 'Logout failed'
        });
    }
}

// New function for 2FA verification during login
async function verify2FALogin(
    request: FastifyRequest<{ Body: { tempToken: string; code: string } }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const { tempToken, code } = request.body;
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error('JWT_SECRET not defined');
        let decoded;
        try {
            decoded = jwt.verify(tempToken, JWT_SECRET) as { id: string; pending2fa: boolean };
        } catch (err) {
            reply.status(401).send({ success: false, message: 'Invalid temporary token' });
            return;
        }
        if (!decoded.pending2fa) {
            reply.status(401).send({ success: false, message: 'Invalid temporary token' });
            return;
        }
        const user = await userModel.findUserById(decoded.id);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            reply.status(401).send({ success: false, message: 'Invalid user or 2FA not enabled' });
            return;
        }
        let verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 2
        });
        if (!verified && user.twoFactorBackupCodes) {
            const backupCodes = JSON.parse(user.twoFactorBackupCodes);
            const codeIndex = backupCodes.indexOf(code.toUpperCase());
            if (codeIndex !== -1) {
                verified = true;
                backupCodes.splice(codeIndex, 1);
                await userModel.updateUserById(user.id, {
                    twoFactorBackupCodes: JSON.stringify(backupCodes)
                });
            }
        }
        if (!verified) {
            reply.status(401).send({ success: false, message: 'Invalid 2FA code' });
            return;
        }
        const { password, ...safeUser } = user;
        const accessToken = generateJWT(user.id, process.env.ACCESS_TOKEN_EXP || '15m');
        const refreshToken = generateJWT(user.id, process.env.REFRESH_TOKEN_EXP || '7d');
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });
        reply.send({
            success: true,
            accessToken,
            user: safeUser
        });
    } catch (error) {
        console.error('2FA login verification error:', error);
        reply.status(500).send({ success: false, message: 'Internal server error' });
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
    logout,
    verify2FALogin
};