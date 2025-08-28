import { FastifyRequest, FastifyReply } from 'fastify';
import userModel, { User } from '../models/userModel';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

interface UpdateProfileRequest {
    fullName?: string;
    nickName?: string;
    picture?: string;
}

interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface Enable2FARequest {
    token: string;
}

interface Verify2FARequest {
    token: string;
}

interface Disable2FARequest {
    token: string;
    password?: string;
}

interface SyncGoogleProfileRequest {
    googleToken: string;
}

// Get current user profile
export async function getProfile(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Remove sensitive data
        const { password, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user;
        
        reply.send({
            success: true,
            user: safeUser
        });
    } catch (error) {
        console.error('Get profile error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Update profile information
export async function updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileRequest }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const { fullName, nickName, picture } = request.body;

        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Validate input
        if (!fullName && !nickName && !picture) {
            reply.status(400).send({
                success: false,
                message: 'At least one field must be provided'
            });
            return;
        }

        // Restrict certain updates for Google users
        if (user.isGoogleUser && (fullName || picture)) {
            reply.status(400).send({
                success: false,
                message: 'Google users cannot modify name or picture. These are synced from Google account.'
            });
            return;
        }

        if (fullName && (fullName.trim().length < 2 || fullName.trim().length > 50)) {
            reply.status(400).send({
                success: false,
                message: 'Full name must be between 2 and 50 characters'
            });
            return;
        }

        if (nickName && (nickName.trim().length < 2 || nickName.trim().length > 30)) {
            reply.status(400).send({
                success: false,
                message: 'Nickname must be between 2 and 30 characters'
            });
            return;
        }

        const updateData: Partial<User> = {};
        if (fullName) updateData.fullName = fullName.trim();
        if (nickName) updateData.nickName = nickName.trim();
        if (picture) updateData.picture = picture;

        const updatedUser = await userModel.updateUserById(userId, updateData);
        if (!updatedUser) {
            reply.status(500).send({
                success: false,
                message: 'Failed to update profile'
            });
            return;
        }

        // Remove sensitive data
        const { password, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = updatedUser;
        
        reply.send({
            success: true,
            message: 'Profile updated successfully',
            user: safeUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Change password
export async function changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const { currentPassword, newPassword, confirmPassword } = request.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            reply.status(400).send({
                success: false,
                message: 'All password fields are required'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            reply.status(400).send({
                success: false,
                message: 'New passwords do not match'
            });
            return;
        }

        if (newPassword.length < 8) {
            reply.status(400).send({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Check if user is Google user (no password)
        if (user.isGoogleUser && !user.password) {
            reply.status(400).send({
                success: false,
                message: 'Google users cannot change password. Please use Google account settings.'
            });
            return;
        }

        // Verify current password
        if (!user.password || !await bcrypt.compare(currentPassword, user.password)) {
            reply.status(400).send({
                success: false,
                message: 'Current password is incorrect'
            });
            return;
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await userModel.updateUserById(userId, {
            password: hashedNewPassword
        });

        if (!updatedUser) {
            reply.status(500).send({
                success: false,
                message: 'Failed to update password'
            });
            return;
        }

        reply.send({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Generate 2FA secret and QR code
export async function generate2FA(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found'
            });
            return;
        }

        if (user.twoFactorEnabled) {
            reply.status(400).send({
                success: false,
                message: '2FA is already enabled'
            });
            return;
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `ChatApp (${user.email})`,
            issuer: 'ChatApp',
            length: 32
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        // Store secret temporarily (not enabled yet)
        await userModel.updateUserById(userId, {
            twoFactorSecret: secret.base32
        });

        reply.send({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32
        });
    } catch (error) {
        console.error('Generate 2FA error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Enable 2FA
export async function enable2FA(
    request: FastifyRequest<{ Body: Enable2FARequest }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const { token } = request.body;

        if (!token) {
            reply.status(400).send({
                success: false,
                message: 'Token is required'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user || !user.twoFactorSecret) {
            reply.status(400).send({
                success: false,
                message: 'No 2FA setup found. Please generate 2FA first.'
            });
            return;
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            reply.status(400).send({
                success: false,
                message: 'Invalid token'
            });
            return;
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        // Enable 2FA
        await userModel.updateUserById(userId, {
            twoFactorEnabled: true,
            twoFactorBackupCodes: JSON.stringify(backupCodes)
        });

        const updatedUser = await userModel.findUserById(userId);
        const { password, ...safeUser } = updatedUser!;

        reply.send({
            success: true,
            message: '2FA enabled successfully',
            backupCodes,
            user: safeUser
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Disable 2FA
export async function disable2FA(
    request: FastifyRequest<{ Body: Disable2FARequest }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const { token, password } = request.body;

        if (!token) {
            reply.status(400).send({
                success: false,
                message: 'Token or password is required'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found'
            });
            return;
        }

        if (!user.twoFactorEnabled) {
            reply.status(400).send({
                success: false,
                message: '2FA is not enabled'
            });
            return;
        }

        let verified = false;

        // Try to verify with 2FA token first
        if (user.twoFactorSecret) {
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2
            });
        }

        // If 2FA token fails, try backup codes
        if (!verified && user.twoFactorBackupCodes) {
            const backupCodes = JSON.parse(user.twoFactorBackupCodes);
            const codeIndex = backupCodes.indexOf(token.toUpperCase());
            if (codeIndex !== -1) {
                verified = true;
                // Remove used backup code
                backupCodes.splice(codeIndex, 1);
                await userModel.updateUserById(userId, {
                    twoFactorBackupCodes: JSON.stringify(backupCodes)
                });
            }
        }

        // If still not verified and password provided, verify password
        if (!verified && password && user.password) {
            verified = await bcrypt.compare(password, user.password);
        }

        if (!verified) {
            reply.status(400).send({
                success: false,
                message: 'Invalid token or password'
            });
            return;
        }

        // Disable 2FA
        await userModel.updateUserById(userId, {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: null
        });

        const updatedUser = await userModel.findUserById(userId);
        const { password: pw, ...safeUser } = updatedUser!;

        reply.send({
            success: true,
            message: '2FA disabled successfully',
            user: safeUser
        });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Verify 2FA token (for testing)
export async function verify2FA(
    request: FastifyRequest<{ Body: Verify2FARequest }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const { token } = request.body;

        if (!token) {
            reply.status(400).send({
                success: false,
                message: 'Token is required'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            reply.status(400).send({
                success: false,
                message: '2FA is not enabled'
            });
            return;
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        reply.send({
            success: true,
            verified
        });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Sync Google profile data
export async function syncGoogleProfile(
    request: FastifyRequest<{ Body: SyncGoogleProfileRequest }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const userId = request.userId;
        if (!userId) {
            reply.status(401).send({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const { googleToken } = request.body;

        if (!googleToken) {
            reply.status(400).send({
                success: false,
                message: 'Google token is required'
            });
            return;
        }

        const user = await userModel.findUserById(userId);
        if (!user) {
            reply.status(404).send({
                success: false,
                message: 'User not found'
            });
            return;
        }

        if (!user.isGoogleUser) {
            reply.status(400).send({
                success: false,
                message: 'This feature is only available for Google users'
            });
            return;
        }

        // Verify Google token and get updated profile data
        const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID!,
        });
        
        const payload = ticket.getPayload();
        if (!payload || payload.email !== user.email) {
            reply.status(400).send({
                success: false,
                message: 'Invalid Google token or email mismatch'
            });
            return;
        }

        // Update user profile with Google data
        const updateData: Partial<User> = {
            fullName: payload.name!,
            picture: payload.picture!
        };

        const updatedUser = await userModel.updateUserById(userId, updateData);
        if (!updatedUser) {
            reply.status(500).send({
                success: false,
                message: 'Failed to sync profile'
            });
            return;
        }

        // Remove sensitive data
        const { password, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = updatedUser;
        
        reply.send({
            success: true,
            message: 'Profile synced with Google successfully',
            user: safeUser
        });
    } catch (error) {
        console.error('Sync Google profile error:', error);
        reply.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}

export default {
    getProfile,
    updateProfile,
    changePassword,
    generate2FA,
    enable2FA,
    disable2FA,
    verify2FA,
    syncGoogleProfile
};