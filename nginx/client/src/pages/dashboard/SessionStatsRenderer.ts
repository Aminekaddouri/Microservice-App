import { DashboardConfig } from './DashboardConfig';
import { Game } from '@/types/game';
import { i18n } from '@/services/i18n';

export class SessionStatsRenderer {
  private config: DashboardConfig;

  constructor(config: DashboardConfig) {
    this.config = config;
  }

  async renderSessionStats(games: Game[]) {
    const sessionContainer = document.getElementById('session-cards');
    if (!sessionContainer) return;

    let visibleSessions = this.config.sessionsPerPage;

    const renderSessions = async () => {
      const sessions = games.slice(0, visibleSessions);

      const sessionCards = await Promise.all(
        sessions.map(async (game: Game, index: number) => {
          try {
            // Mock session data - replace with actual session logic
            const sessionData = {
              id: game.id,
              duration: Math.floor(Math.random() * 60) + 10, // Random duration 10-70 minutes
              gamesPlayed: Math.floor(Math.random() * 5) + 1, // Random 1-5 games
              winRate: Math.floor(Math.random() * 100), // Random win rate
              date: new Date(game.createdAt || Date.now()).toLocaleDateString()
            };

            return this.renderSessionCard(sessionData, index + 1);
          } catch (error) {
            console.error(`Failed to process session for game ${game.id}:`, error);
            return this.renderErrorSessionCard(game.id);
          }
        })
      );

      sessionContainer.innerHTML = sessionCards.join('');

      // Update session button if needed
      const sessionButton = document.getElementById('session-see-more-btn');
      if (sessionButton) {
        sessionButton.classList.toggle('hidden', visibleSessions >= games.length);
        if (visibleSessions < games.length) {
          const remaining = games.length - visibleSessions;
          sessionButton.textContent = `Load More Sessions (${remaining} remaining)`;
        }
      }
    };

    await renderSessions();

    // Add event listener for "see more" button
    const sessionButton = document.getElementById('session-see-more-btn');
    sessionButton?.addEventListener('click', async () => {
      visibleSessions += this.config.sessionsPerPage;
      await renderSessions();
    });
  }

  private renderSessionCard(sessionData: {
    id: string;
    duration: number;
    gamesPlayed: number;
    winRate: number;
    date: string;
  }, sessionNumber: number): string {
    const { duration, gamesPlayed, winRate, date } = sessionData;

    const cardBg = this.config.theme === 'light' ?
      'bg-white/95 backdrop-blur-sm border border-gray-200/50' :
      'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50';
    
    const textColor = this.config.theme === 'light' ? 'text-gray-800' : 'text-white';
    const subtextColor = this.config.theme === 'light' ? 'text-gray-600' : 'text-gray-300';

    // Determine session quality based on win rate
    const getSessionQuality = () => {
      if (winRate >= 70) return { color: 'text-green-400', icon: '🔥', label: 'Hot Streak' };
      if (winRate >= 50) return { color: 'text-blue-400', icon: '⚡', label: 'Good Session' };
      if (winRate >= 30) return { color: 'text-yellow-400', icon: '📈', label: 'Mixed Results' };
      return { color: 'text-red-400', icon: '📉', label: 'Tough Session' };
    };

    const quality = getSessionQuality();

    return `
      <div class="${cardBg} p-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group">
        <div class="text-center">
          <!-- Session Icon -->
          <div class="text-4xl mb-3">${quality.icon}</div>
          
          <!-- Session Number -->
          <h3 class="${textColor} font-bold text-lg mb-2">Session #${sessionNumber}</h3>
          
          <!-- Session Stats -->
          <div class="space-y-3 mb-4">
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-sm">Duration:</span>
              <span class="${textColor} font-semibold">${duration}m</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-sm">Games:</span>
              <span class="${textColor} font-semibold">${gamesPlayed}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-sm">${i18n.t('dashboard.winRate')}:</span>
              <span class="${quality.color} font-bold">${winRate}%</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-sm">Date:</span>
              <span class="${textColor} font-semibold text-xs">${date}</span>
            </div>
          </div>
          
          <!-- Session Quality Badge -->
          <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${quality.color} bg-current/10">
            ${quality.icon} ${quality.label}
          </div>
        </div>
      </div>
    `;
  }

  private renderErrorSessionCard(gameId: string): string {
    const cardBg = this.config.theme === 'light' ? 'bg-red-50' : 'bg-red-900/20';

    return `
      <div class="${cardBg} p-4 rounded-lg border-2 border-red-300 text-center">
        <div class="text-red-500 text-2xl mb-2">⚠️</div>
        <p class="text-red-600 text-sm">Error loading session</p>
        <p class="text-xs text-gray-500 mt-1">Game ID: ${gameId}</p>
      </div>
    `;
  }
}