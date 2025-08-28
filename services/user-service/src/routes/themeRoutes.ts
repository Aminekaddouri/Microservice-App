import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import themeController from '../controllers/themeController';
import { verifyToken } from '../middlewares/verifyToken';

interface ThemeData {
  name: string;
  board: string;
  colors: string;
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
}

export default async function themeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get current user's theme
  fastify.get('/current', { preHandler: verifyToken }, themeController.getCurrentTheme);
  
  // Create or update user's theme
  fastify.post('/', { 
    preHandler: [verifyToken, fastify.csrfProtection] 
  }, themeController.saveTheme);
  
  // Get all themes for a user
  fastify.get('/', { preHandler: verifyToken }, themeController.getUserThemes);
  
  // Delete a theme
  fastify.delete('/:id', { preHandler: verifyToken }, themeController.deleteTheme);
}