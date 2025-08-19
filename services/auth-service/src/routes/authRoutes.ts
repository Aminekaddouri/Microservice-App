import { FastifyInstance } from 'fastify';
import authController from '../controllers/authController';
import { verifyToken } from '../middlewares/verifyToken';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', authController.registerUser);
  fastify.post('/login', authController.loginUser);
  fastify.post('/google', authController.googleAuth);
  fastify.get('/verify', authController.verify);
  fastify.post('/refresh', authController.refresh);
  fastify.get('/verify-email', authController.verifyEmail);
  fastify.get('/is-email-verified', authController.isEmailVerified);
  fastify.get('/resend-verification-email', authController.resendVerificationEmail);
}

// mohammed fastify.get('/verify', authController.verify);
// import { FastifyInstance } from "fastify";
// import authController from "../controllers/authController"
// import { verifyToken } from "../middlewares/verifyToken";


// export async function authRoutes(
//     fastify: FastifyInstance
// ): Promise<void> {
//     fastify.post('/register', authController.registerUser);
//     fastify.post('/login', authController.loginUser);
//     fastify.post('/google', authController.googleAuth);
//     fastify.get('/verify', authController.verify);
//     fastify.post('/refresh', authController.refresh);
//     fastify.get('/verify-email', authController.verifyEmail);
//     fastify.get('/is-email-verified', authController.isEmailVerified);
//     fastify.get('/resend-verification-email', authController.resendVerificationEmail);
// }