import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { openDB } from '../database/db'; // ✅ Named import

interface ThemeData {
  name: string;
  board: string;
  colors: string;
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
}

interface Theme extends ThemeData {
  id: string;
  userId: string;
  created_at: string;
  updated_at: string;
}

class ThemeController {
  async getCurrentTheme(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.userId;

      const db = await openDB();
      const theme = await db.get<Theme | null>(
        'SELECT * FROM Theme WHERE userId = ? ORDER BY updated_at DESC LIMIT 1',
        [userId]
      );

      if (!theme) {
        const defaultTheme = {
          id: 'default',
          userId,
          name: 'Default Theme',
          board: 'default',
          colors: JSON.stringify({
            board: '#000000',
            leftPaddle: '#FFFFFF',
            rightPaddle: '#FFFFFF',
            ball: '#FFFFFF'
          }),
          board_color: '#000000',
          left_paddle_color: '#FFFFFF',
          right_paddle_color: '#FFFFFF',
          ball_color: '#FFFFFF',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return reply.send({ data: defaultTheme });
      }

      return reply.send({ data: theme });
    } catch (error) {
      console.error('Error fetching current theme:', error);
      return reply.status(500).send({
        error: 'Failed to fetch current theme',
        message: 'An error occurred while retrieving your theme settings'
      });
    }
  }

  async saveTheme(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.userId;
      const { name, board, colors, board_color, left_paddle_color, right_paddle_color, ball_color } = request.body as ThemeData;

      if (!name || !board || !colors || !board_color || !left_paddle_color || !right_paddle_color || !ball_color) {
        return reply.status(400).send({
          error: 'Missing required fields',
          message: 'All theme color fields are required'
        });
      }

      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      const colors_to_validate = [board_color, left_paddle_color, right_paddle_color, ball_color];

      for (const color of colors_to_validate) {
        if (!hexColorRegex.test(color)) {
          return reply.status(400).send({
            error: 'Invalid color format',
            message: `Color ${color} is not a valid hex color. Please use format #RRGGBB`
          });
        }
      }

      const now = new Date().toISOString();
      const db = await openDB();

      const existingTheme = await db.get<Theme | null>(
        'SELECT * FROM Theme WHERE userId = ? LIMIT 1',
        [userId]
      );

      if (existingTheme) {
        await db.run(
          `UPDATE Theme SET 
           name = ?, board = ?, colors = ?, 
           board_color = ?, left_paddle_color = ?, right_paddle_color = ?, ball_color = ?,
           updated_at = ?
           WHERE userId = ?`,
          [name, board, colors, board_color, left_paddle_color, right_paddle_color, ball_color, now, userId]
        );

        return reply.send({
          message: 'Theme updated successfully',
          data: { ...existingTheme, name, board, colors, board_color, left_paddle_color, right_paddle_color, ball_color, updated_at: now }
        });
      } else {
        const themeId = uuidv4();
        await db.run(
          `INSERT INTO Theme (id, userId, name, board, colors, board_color, left_paddle_color, right_paddle_color, ball_color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [themeId, userId, name, board, colors, board_color, left_paddle_color, right_paddle_color, ball_color, now, now]
        );

        const newTheme: Theme = {
          id: themeId,
          userId,
          name,
          board,
          colors,
          board_color,
          left_paddle_color,
          right_paddle_color,
          ball_color,
          created_at: now,
          updated_at: now
        };

        return reply.status(201).send({
          message: 'Theme created successfully',
          data: newTheme
        });
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      return reply.status(500).send({
        error: 'Failed to save theme',
        message: 'An error occurred while saving your theme'
      });
    }
  }

  async getUserThemes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.userId;
      const db = await openDB();

      const themes = await db.all<Theme[]>(
        'SELECT * FROM Theme WHERE userId = ? ORDER BY updated_at DESC',
        [userId]
      );

      return reply.send({ data: themes });
    } catch (error) {
      console.error('Error fetching user themes:', error);
      return reply.status(500).send({
        error: 'Failed to fetch themes',
        message: 'An error occurred while retrieving your themes'
      });
    }
  }

  async deleteTheme(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.userId;
      const { id } = request.params as { id: string };

      const db = await openDB();

      const theme = await db.get<Theme | null>(
        'SELECT * FROM Theme WHERE id = ? AND userId = ?',
        [id, userId]
      );

      if (!theme) {
        return reply.status(404).send({
          error: 'Theme not found',
          message: 'The specified theme does not exist or does not belong to you'
        });
      }

      await db.run('DELETE FROM Theme WHERE id = ? AND userId = ?', [id, userId]);

      return reply.send({ message: 'Theme deleted successfully' });
    } catch (error) {
      console.error('Error deleting theme:', error);
      return reply.status(500).send({
        error: 'Failed to delete theme',
        message: 'An error occurred while deleting the theme'
      });
    }
  }
}

export default new ThemeController();