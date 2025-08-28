import { api } from '@/services/api';
import { showToast } from '@/utils/utils';
import { i18n } from '@/services/i18n';
import { loadAndApplyTheme, updateCurrentTheme } from '@/services/themeService';

export interface ThemeColors {
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
}

export interface Theme {
  id: string;
  userId: string;
  name: string;
  board: string;
  colors: string;
  board_color: string;
  left_paddle_color: string;
  right_paddle_color: string;
  ball_color: string;
  created_at: string;
  updated_at: string;
}

export function showThemeEditor() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-semibold text-white">${i18n.t('game.themeEditor')}</h3>
          <button id="close-theme-editor" class="text-white/60 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Color Customization -->
          <div class="space-y-6">
            <h4 class="text-lg font-medium text-white">${i18n.t('game.customizeColors')}</h4>
            
            <!-- Board Background -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-white">${i18n.t('game.boardBackground')}</label>
              <div class="flex items-center gap-3">
                <input 
                  type="color" 
                  id="board-color" 
                  value="#1a1a1a" 
                  class="w-12 h-12 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer"
                >
                <input 
                  type="text" 
                  id="board-color-text" 
                  value="#1a1a1a" 
                  class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-sm"
                  placeholder="#1a1a1a"
                >
              </div>
            </div>
            
            <!-- Left Paddle -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-white">${i18n.t('game.leftPaddle')}</label>
              <div class="flex items-center gap-3">
                <input 
                  type="color" 
                  id="left-paddle-color" 
                  value="#ff6b23" 
                  class="w-12 h-12 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer"
                >
                <input 
                  type="text" 
                  id="left-paddle-color-text" 
                  value="#ff6b23" 
                  class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-sm"
                  placeholder="#ff6b23"
                >
              </div>
            </div>
            
            <!-- Right Paddle -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-white">${i18n.t('game.rightPaddle')}</label>
              <div class="flex items-center gap-3">
                <input 
                  type="color" 
                  id="right-paddle-color" 
                  value="#ff6b23" 
                  class="w-12 h-12 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer"
                >
                <input 
                  type="text" 
                  id="right-paddle-color-text" 
                  value="#ff6b23" 
                  class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-sm"
                  placeholder="#ff6b23"
                >
              </div>
            </div>
            
            <!-- Ball -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-white">${i18n.t('game.ball')}</label>
              <div class="flex items-center gap-3">
                <input 
                  type="color" 
                  id="ball-color" 
                  value="#fdba74" 
                  class="w-12 h-12 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer"
                >
                <input 
                  type="text" 
                  id="ball-color-text" 
                  value="#fdba74" 
                  class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-sm"
                  placeholder="#fdba74"
                >
              </div>
            </div>
          </div>
          
          <!-- Preview -->
          <div class="space-y-6">
            <h4 class="text-lg font-medium text-white">${i18n.t('game.preview')}</h4>
            <div class="relative">
              <div 
                id="game-preview" 
                class="w-full h-64 rounded-xl border-2 border-white/20 relative overflow-hidden"
                style="background-color: #1a1a1a;"
              >
                <!-- Game Board -->
                <div class="absolute inset-2 border border-white/30 rounded-lg">
                  <!-- Center Line -->
                  <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 transform -translate-x-1/2"></div>
                  
                  <!-- Left Paddle -->
                  <div 
                    id="preview-left-paddle" 
                    class="absolute left-4 top-1/2 w-2 h-16 rounded-sm transform -translate-y-1/2"
                    style="background-color: #ff6b23;"
                  ></div>
                  
                  <!-- Right Paddle -->
                  <div 
                    id="preview-right-paddle" 
                    class="absolute right-4 top-1/2 w-2 h-16 rounded-sm transform -translate-y-1/2"
                    style="background-color: #ff6b23;"
                  ></div>
                  
                  <!-- Ball -->
                  <div 
                    id="preview-ball" 
                    class="absolute left-1/2 top-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style="background-color: #fdba74;"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-4 pt-4">
          <button 
            id="reset-theme"
            class="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-6 transition-all duration-300 border border-white/20 hover:border-white/30"
          >
            ${i18n.t('game.resetToDefault')}
          </button>
          <button 
            id="save-theme"
            class="flex-1 bg-gradient-to-r from-purple-500/90 to-purple-600/90 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl py-3 px-6 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] border border-purple-400/30"
          >
            ${i18n.t('game.saveTheme')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupThemeEditorEvents(modal);
  loadCurrentTheme();
}

function setupThemeEditorEvents(modal: HTMLElement) {
  // Close modal
  modal.querySelector('#close-theme-editor')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Color picker events
  setupColorPicker('board-color', 'board-color-text', updatePreview);
  setupColorPicker('left-paddle-color', 'left-paddle-color-text', updatePreview);
  setupColorPicker('right-paddle-color', 'right-paddle-color-text', updatePreview);
  setupColorPicker('ball-color', 'ball-color-text', updatePreview);
  
  // Reset theme
  modal.querySelector('#reset-theme')?.addEventListener('click', resetToDefault);
  
  // Save theme
  modal.querySelector('#save-theme')?.addEventListener('click', () => saveTheme(modal));
}

function setupColorPicker(colorId: string, textId: string, callback: () => void) {
  const colorInput = document.getElementById(colorId) as HTMLInputElement;
  const textInput = document.getElementById(textId) as HTMLInputElement;
  
  if (!colorInput || !textInput) return;
  
  // Color picker change
  colorInput.addEventListener('input', () => {
    textInput.value = colorInput.value;
    callback();
  });
  
  // Text input change
  textInput.addEventListener('input', () => {
    if (isValidColor(textInput.value)) {
      colorInput.value = textInput.value;
      callback();
    }
  });
  
  // Text input blur - validate and correct
  textInput.addEventListener('blur', () => {
    if (!isValidColor(textInput.value)) {
      textInput.value = colorInput.value;
      showToast('Invalid color format. Please use hex format (#RRGGBB)', 'error');
    }
  });
}

function isValidColor(color: string): boolean {
  // Check if it's a valid hex color
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

function updatePreview() {
  const boardColor = (document.getElementById('board-color') as HTMLInputElement)?.value || '#1a1a1a';
  const leftPaddleColor = (document.getElementById('left-paddle-color') as HTMLInputElement)?.value || '#ff6b23';
  const rightPaddleColor = (document.getElementById('right-paddle-color') as HTMLInputElement)?.value || '#ff6b23';
  const ballColor = (document.getElementById('ball-color') as HTMLInputElement)?.value || '#fdba74';
  
  const preview = document.getElementById('game-preview');
  const leftPaddle = document.getElementById('preview-left-paddle');
  const rightPaddle = document.getElementById('preview-right-paddle');
  const ball = document.getElementById('preview-ball');
  
  if (preview) preview.style.backgroundColor = boardColor;
  if (leftPaddle) leftPaddle.style.backgroundColor = leftPaddleColor;
  if (rightPaddle) rightPaddle.style.backgroundColor = rightPaddleColor;
  if (ball) ball.style.backgroundColor = ballColor;
}

function resetToDefault() {
  const defaults = {
    'board-color': '#000000',
    'left-paddle-color': '#FFFFFF',
    'right-paddle-color': '#FFFFFF',
    'ball-color': '#FFFFFF'
  };
  
  Object.entries(defaults).forEach(([id, color]) => {
    const colorInput = document.getElementById(id) as HTMLInputElement;
    const textInput = document.getElementById(id + '-text') as HTMLInputElement;
    
    if (colorInput) colorInput.value = color;
    if (textInput) textInput.value = color;
  });
  
  updatePreview();
}

async function loadCurrentTheme() {
  try {
    const response = await api.get('themes/current') as { data: Theme };
    const theme = response.data;
    
    if (theme) {
      const colorInputs = {
        'board-color': theme.board_color || '#000000',
        'left-paddle-color': theme.left_paddle_color || '#FFFFFF',
        'right-paddle-color': theme.right_paddle_color || '#FFFFFF',
        'ball-color': theme.ball_color || '#FFFFFF'
      };
      
      Object.entries(colorInputs).forEach(([id, color]) => {
        const colorInput = document.getElementById(id) as HTMLInputElement;
        const textInput = document.getElementById(id + '-text') as HTMLInputElement;
        
        if (colorInput) colorInput.value = color;
        if (textInput) textInput.value = color;
      });
      
      updatePreview();
    }
  } catch (error) {
    console.error('Failed to load current theme:', error);
    // Use defaults if loading fails
    resetToDefault();
  }
}

async function saveTheme(modal: HTMLElement) {
  const boardColor = (document.getElementById('board-color') as HTMLInputElement).value;
  const leftPaddleColor = (document.getElementById('left-paddle-color') as HTMLInputElement).value;
  const rightPaddleColor = (document.getElementById('right-paddle-color') as HTMLInputElement).value;
  const ballColor = (document.getElementById('ball-color') as HTMLInputElement).value;
  
  // Validate colors
  const colors = [boardColor, leftPaddleColor, rightPaddleColor, ballColor];
  if (!colors.every(isValidColor)) {
    showToast('Please ensure all colors are in valid hex format', 'error');
    return;
  }
  
  try {
    const themeData = {
      name: 'Custom Theme',
      board: 'custom',
      colors: JSON.stringify({
        board: boardColor,
        leftPaddle: leftPaddleColor,
        rightPaddle: rightPaddleColor,
        ball: ballColor
      }),
      board_color: boardColor,
      left_paddle_color: leftPaddleColor,
      right_paddle_color: rightPaddleColor,
      ball_color: ballColor
    };
    
    await api.post('themes', themeData);
    
    // Update the current theme in memory and apply to any active games
    updateCurrentTheme(themeData);
    await loadAndApplyTheme();
    
    showToast('Theme saved successfully!', 'success');
    document.body.removeChild(modal);
  } catch (error: any) {
    console.error('Failed to save theme:', error);
    showToast(error.response?.data?.message || 'Failed to save theme', 'error');
  }
}