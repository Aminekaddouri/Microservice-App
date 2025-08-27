import { api } from './api';

export interface UserTheme {
  id?: number;
  name: string;
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
  userId?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DefaultTheme {
  id: number;
  name: string;
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
}

class ThemeService {
  private currentTheme: UserTheme | null = null;
  private defaultTheme: UserTheme = {
    name: 'Default',
    board_color: '#1a1a1a',
    left_paddle_color: '#fb923c', // orange-400
    right_paddle_color: '#fb923c', // orange-400
    ball_color: '#fdba74' // orange-300
  };

  /**
   * Load the current user's theme from the API
   */
  async loadUserTheme(): Promise<UserTheme> {
    try {
      const response = await api.get('themes/user') as any;
      if (response && response.theme) {
        this.currentTheme = response.theme;
        return this.currentTheme;
      }
    } catch (error) {
      console.warn('Failed to load user theme, using default:', error);
    }
    
    // Return default theme if no user theme found
    this.currentTheme = this.defaultTheme;
    return this.defaultTheme;
  }

  /**
   * Get the current theme (loads from API if not already loaded)
   */
  async getCurrentTheme(): Promise<UserTheme> {
    if (!this.currentTheme) {
      return await this.loadUserTheme();
    }
    return this.currentTheme;
  }

  /**
   * Get the default theme
   */
  getDefaultTheme(): UserTheme {
    return { ...this.defaultTheme };
  }

  /**
   * Save a theme for the current user
   */
  async saveUserTheme(theme: Omit<UserTheme, 'id' | 'userId' | 'created_at' | 'updated_at'>): Promise<UserTheme> {
    try {
      const response = await api.post('themes/user', theme) as any;
      if (response && response.theme) {
        this.currentTheme = response.theme;
        return this.currentTheme;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Failed to save user theme:', error);
      throw error;
    }
  }

  /**
   * Get available default themes
   */
  async getDefaultThemes(): Promise<DefaultTheme[]> {
    try {
      const response = await api.get('themes/defaults') as any;
      return response.themes || [];
    } catch (error) {
      console.error('Failed to load default themes:', error);
      return [];
    }
  }

  /**
   * Clear the cached theme (force reload on next access)
   */
  clearCache(): void {
    this.currentTheme = null;
  }

  /**
   * Convert hex color to RGB values
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Get CSS custom properties for the current theme
   */
  async getThemeCSSProperties(): Promise<Record<string, string>> {
    const theme = await this.getCurrentTheme();
    return {
      '--game-board-color': theme.board_color,
      '--game-left-paddle-color': theme.left_paddle_color,
      '--game-right-paddle-color': theme.right_paddle_color,
      '--game-ball-color': theme.ball_color
    };
  }
}

// Export a singleton instance
export const themeService = new ThemeService();
export default themeService;