import { api } from './api';

export interface GameTheme {
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
}

const DEFAULT_THEME: GameTheme = {
  board_color: '#1a1a1a',
  left_paddle_color: '#fb923c', // orange-400
  right_paddle_color: '#fb923c', // orange-400
  ball_color: '#fdba74' // orange-300
};

let currentTheme: GameTheme = DEFAULT_THEME;

/**
 * Load the current user's theme from the API
 */
export async function loadCurrentTheme(): Promise<GameTheme> {
  try {
    const response = await api.get('themes/current') as { data: GameTheme };
    if (response.data) {
      currentTheme = {
        board_color: response.data.board_color || DEFAULT_THEME.board_color,
        left_paddle_color: response.data.left_paddle_color || DEFAULT_THEME.left_paddle_color,
        right_paddle_color: response.data.right_paddle_color || DEFAULT_THEME.right_paddle_color,
        ball_color: response.data.ball_color || DEFAULT_THEME.ball_color
      };
    }
  } catch (error) {
    console.warn('Failed to load theme, using default:', error);
    currentTheme = DEFAULT_THEME;
  }
  return currentTheme;
}

/**
 * Get the current theme (loads from API if not already loaded)
 */
export async function getCurrentTheme(): Promise<GameTheme> {
  if (currentTheme === DEFAULT_THEME) {
    return await loadCurrentTheme();
  }
  return currentTheme;
}

/**
 * Apply theme colors to game elements
 */
export function applyThemeToGameElements(theme: GameTheme) {
  // Apply board color
  const gameFrame = document.getElementById('gameFrame');
  if (gameFrame) {
    gameFrame.style.backgroundColor = theme.board_color;
  }

  // Apply paddle colors
  const paddles = document.querySelectorAll('[class*="bg-orange-400"]');
  paddles.forEach((paddle, index) => {
    const element = paddle as HTMLElement;
    // Remove existing background color classes
    element.classList.remove('bg-orange-400');
    
    // Apply theme color based on paddle position
    if (index === 0) {
      element.style.backgroundColor = theme.left_paddle_color;
    } else {
      element.style.backgroundColor = theme.right_paddle_color;
    }
  });

  // Apply ball color
  const ball = document.querySelector('[class*="bg-orange-300"]') as HTMLElement;
  if (ball) {
    ball.classList.remove('bg-orange-300');
    ball.style.backgroundColor = theme.ball_color;
  }
}

/**
 * Load and apply the current user's theme to the game
 */
export async function loadAndApplyTheme(): Promise<void> {
  const theme = await getCurrentTheme();
  applyThemeToGameElements(theme);
}

/**
 * Reset theme to default values
 */
export function resetToDefaultTheme(): void {
  currentTheme = DEFAULT_THEME;
  applyThemeToGameElements(DEFAULT_THEME);
}

/**
 * Update the current theme in memory (used after saving a new theme)
 */
export function updateCurrentTheme(theme: GameTheme): void {
  currentTheme = theme;
}