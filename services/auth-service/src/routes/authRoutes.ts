import { FastifyInstance } from "fastify";
import authController from "../controllers/authController";
import { verifyToken } from "../middlewares/verifyToken";
import { authRateLimiter, generalAuthRateLimiter, refreshTokenRateLimiter, emailVerificationRateLimiter } from "../middlewares/rateLimiter";


export async function authRoutes(
    fastify: FastifyInstance
): Promise<void> {
    fastify.register(async function (fastify) {
        await fastify.addHook('preHandler', generalAuthRateLimiter);
        fastify.post('/register', authController.registerUser);
    });
    
    fastify.register(async function (fastify) {
        await fastify.addHook('preHandler', authRateLimiter);
        fastify.post('/login', authController.loginUser);
        fastify.post('/google', authController.googleAuth);
        fastify.post('/verify-2fa', authController.verify2FALogin);
    });
    
    fastify.register(async function (fastify) {
        await fastify.addHook('preHandler', refreshTokenRateLimiter);
        fastify.post('/refresh', authController.refresh);
    });
    
    fastify.register(async function (fastify) {
        await fastify.addHook('preHandler', generalAuthRateLimiter);
        fastify.get('/verify', authController.verify);
        fastify.get('/email-verification', authController.verifyEmail);
        fastify.get('/resend-verification-email', authController.resendVerificationEmail);
    });

    fastify.register(async function (fastify) {
        await fastify.addHook('preHandler', emailVerificationRateLimiter);
        fastify.get('/is-email-verified', authController.isEmailVerified);
    });

    fastify.post('/logout', authController.logout);
}