import { DashboardConfig } from './DashboardConfig';
import { Game } from '@/types/game';
import { i18n } from '@/services/i18n';
import { api } from '@/services/api';

export class SessionStatsRenderer {
  private config: DashboardConfig;

  constructor(config: DashboardConfig) {
    this.config = config;
  }

  async renderSessionStats(games: Game[]) {
    const sessionContainer = document.getElementById('session-stats');
    if (!sessionContainer) return;

    // Group games into sessions (games played within 2 hours of each other)
    const sessions = this.groupGamesIntoSessions(games);
    let visibleSessions = Math.min(this.config.sessionsPerPage, sessions.length);

    const renderSessions = async () => {
      const sessionsToShow = sessions.slice(0, visibleSessions);

      const sessionCards = await Promise.all(
        sessionsToShow.map(async (sessionGames: Game[], index: number) => {
          try {
            const sessionData = await this.calculateSessionData(sessionGames);
            return this.renderSessionCard(sessionData, index + 1);
          } catch (error) {
            console.error(`Failed to process session ${index + 1}:`, error);
            return this.renderErrorSessionCard(`session-${index + 1}`);
          }
        })
      );

      sessionContainer.innerHTML = sessionCards.join('');

      // Update session button if needed
      const sessionButton = document.getElementById('session-see-more-btn');
      if (sessionButton) {
        sessionButton.classList.toggle('hidden', visibleSessions >= sessions.length);
        if (visibleSessions < sessions.length) {
          const remaining = sessions.length - visibleSessions;
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

  private groupGamesIntoSessions(games: Game[]): Game[][] {
    if (!games.length) return [];

    // Sort games by creation date (newest first)
    const sortedGames = [...games].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const sessions: Game[][] = [];
    let currentSession: Game[] = [sortedGames[0]];

    for (let i = 1; i < sortedGames.length; i++) {
      const currentGame = sortedGames[i];
      const lastGameInSession = currentSession[currentSession.length - 1];
      
      const currentGameTime = new Date(currentGame.createdAt || 0).getTime();
      const lastGameTime = new Date(lastGameInSession.createdAt || 0).getTime();
      
      // If games are within 2 hours of each other, they're in the same session
      const timeDifference = Math.abs(lastGameTime - currentGameTime);
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      
      if (timeDifference <= twoHoursInMs) {
        currentSession.push(currentGame);
      } else {
        // Start a new session
        sessions.push(currentSession);
        currentSession = [currentGame];
      }
    }
    
    // Add the last session
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private async calculateSessionData(sessionGames: Game[]): Promise<{
    id: string;
    duration: number;
    gamesPlayed: number;
    winRate: number;
    date: string;
  }> {
    const gamesPlayed = sessionGames.length;
    
    // Calculate wins using participant data
    const currentUserId = this.getCurrentUserId();
    let wins = 0;
    
    for (const game of sessionGames) {
      try {
        const { participants } = await api.getGameParticipants(game.id);
        const userParticipant = participants.find((p: any) => p.userId === currentUserId);
        if (userParticipant && userParticipant.isWinner) {
          wins++;
        }
      } catch (error) {
        console.error(`Failed to get participants for game ${game.id}:`, error);
      }
    }
    
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    
    // Calculate session duration
    const sessionStart = Math.min(...sessionGames.map(game => 
      new Date(game.createdAt || 0).getTime()
    ));
    const sessionEnd = Math.max(...sessionGames.map(game => 
      new Date(game.finishedAt || game.createdAt || 0).getTime()
    ));
    
    const durationMs = sessionEnd - sessionStart;
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60))); // At least 1 minute
    
    // Use the date of the first game in the session
    const sessionDate = new Date(sessionStart).toLocaleDateString();
    
    return {
      id: `session-${sessionStart}`,
      duration: durationMinutes,
      gamesPlayed,
      winRate,
      date: sessionDate
    };
  }

  private getCurrentUserId(): string {
    // Get current user ID from localStorage or global state
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || '';
      }
    } catch (error) {
      console.error('Failed to get current user ID:', error);
    }
    return '';
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
      <div class="${cardBg} p-4 sm:p-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group min-h-[280px] flex flex-col">
        <div class="text-center flex-1 flex flex-col justify-between">
          <!-- Session Icon -->
          <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">${quality.icon}</div>
          
          <!-- Session Number -->
          <h3 class="${textColor} font-bold text-base sm:text-lg mb-2">Session #${sessionNumber}</h3>
          
          <!-- Session Stats -->
          <div class="space-y-2 sm:space-y-3 mb-3 sm:mb-4 flex-1">
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-xs sm:text-sm">Duration:</span>
              <span class="${textColor} font-semibold text-xs sm:text-sm">${duration}m</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-xs sm:text-sm">Games:</span>
              <span class="${textColor} font-semibold text-xs sm:text-sm">${gamesPlayed}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-xs sm:text-sm">${i18n.t('dashboard.winRate')}:</span>
              <span class="${quality.color} font-bold text-xs sm:text-sm">${winRate}%</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="${subtextColor} text-xs sm:text-sm">Date:</span>
              <span class="${textColor} font-semibold text-xs">${date}</span>
            </div>
          </div>
          
          <!-- Session Quality Badge -->
          <div class="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${quality.color} bg-current/10">
            <span class="mr-1">${quality.icon}</span>
            <span class="hidden sm:inline">${quality.label}</span>
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