import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import userController from '../controllers/userController';
import { canAccessUser } from '../middlewares/canAccessUser';

export default async function userRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/', userController.getAllUsers);
  fastify.get('/:id', userController.getUserById);
  fastify.put('/:id', { preHandler: canAccessUser }, userController.updateUser);
  fastify.delete('/:id', { preHandler: canAccessUser }, userController.deleteUser);
  fastify.post('/sync', userController.syncUser); //*******************//
}