import { api } from '@/services/api';
import { Game, GameParticipant } from '@/types/game';
import { DashboardConfig } from './DashboardConfig';

export class GameUtils {
  private config: DashboardConfig;

  constructor(config: DashboardConfig) {
    this.config = config;
  }

  async getUserInfo(userId: string) {
    try {
      return await api.getuserbyid(userId);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }

  renderGameCard(data: {
    opponent: any;
    userScore: number;
    opponentScore: number;
    isWinner: boolean;
    isDraw: boolean;
    gameNumber: number;
  }): string {
    const { opponent, userScore, opponentScore, isWinner, isDraw, gameNumber } = data;

    // Enhanced styling based on game result
    const resultStyles = {
      win: {
        border: 'border-green-400/50',
        bg: 'bg-gradient-to-br from-green-50/10 to-emerald-50/5',
        accent: 'text-green-400',
        icon: '🏆',
        glow: 'shadow-green-500/20'
      },
      loss: {
        border: 'border-red-400/50',
        bg: 'bg-gradient-to-br from-red-50/10 to-pink-50/5',
        accent: 'text-red-400',
        icon: '💔',
        glow: 'shadow-red-500/20'
      },
      draw: {
        border: 'border-gray-400/50',
        bg: 'bg-gradient-to-br from-gray-50/10 to-slate-50/5',
        accent: 'text-gray-400',
        icon: '🤝',
        glow: 'shadow-gray-500/20'
      }
    };

    const result = isDraw ? 'draw' : isWinner ? 'win' : 'loss';
    const style = resultStyles[result];
    
    const cardBg = this.config.theme === 'light' ? 
      'bg-white/95 backdrop-blur-sm' : 
      'bg-gray-800/95 backdrop-blur-sm';
    const textColor = this.config.theme === 'light' ? 'text-gray-800' : 'text-white';
    const subtextColor = this.config.theme === 'light' ? 'text-gray-600' : 'text-gray-300';

    // Enhanced image handling with multiple fallbacks
    const getImageSrc = () => {
      if (opponent?.user?.picture) return opponent.user.picture;
      if (opponent?.user?.googlePicture) return opponent.user.googlePicture;
      if (opponent?.user?.avatar) return opponent.user.avatar;
      // Return a data URL for a default avatar instead of a file path
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiM2MzY2RjEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM3IiByPSIxMyIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMjUgNzVjMC0xMy44IDExLjItMjUgMjUtMjVzMjUgMTEuMiAyNSAyNXYxMEgyNVY3NXoiIGZpbGw9IndoaXRlIi8+PC9zdmc+';
    };

    const getImageFallback = () => {
      const name = opponent?.user?.fullName || opponent?.user?.nickname || 'Player';
      return name.charAt(0).toUpperCase();
    };

    const getRandomGradient = () => {
       const gradients = [
         'from-blue-500 to-purple-600',
         'from-green-500 to-teal-600',
         'from-orange-500 to-red-600',
         'from-pink-500 to-rose-600',
         'from-indigo-500 to-blue-600',
         'from-purple-500 to-pink-600'
       ];
       const hash = (opponent?.user?.id || opponent?.user?.fullName || 'default').split('').reduce((a: number, b: string) => {
         a = ((a << 5) - a) + b.charCodeAt(0);
         return a & a;
       }, 0);
       return gradients[Math.abs(hash) % gradients.length];
     };

    return `
      <div class="relative overflow-hidden rounded-2xl 
           bg-gradient-to-br from-white/10 via-white/5 to-transparent 
           backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl
           hover:shadow-${result === 'win' ? 'green' : result === 'loss' ? 'red' : 'gray'}-500/30 
           hover:border-${result === 'win' ? 'green' : result === 'loss' ? 'red' : 'gray'}-400/40 
           transition-all duration-500 group cursor-pointer
           before:absolute before:inset-0 before:${style.bg} before:rounded-2xl before:opacity-30">
        
        <!-- Enhanced Background Effects -->
        <div class="absolute inset-0 bg-gradient-to-br ${style.bg} opacity-20"></div>
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${style.border.replace('border-', 'from-')} ${style.border.replace('border-', 'to-')} opacity-60"></div>
        
        <!-- Content -->
        <div class="relative z-10 p-6 text-center">
          <!-- Enhanced Player Avatar with Glow -->
          <div class="relative mb-6">
            <div class="relative">
              <!-- Glow Effect -->
              <div class="absolute -inset-3 bg-gradient-to-r ${style.border.replace('border-', 'from-')} ${style.border.replace('border-', 'to-')} rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
              
              <!-- Avatar Container -->
              <div class="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/30 shadow-xl group-hover:border-white/50 transition-all duration-300">
                <img src="${getImageSrc()}" 
                     alt="${opponent?.user?.fullName || 'Player'}" 
                     class="w-full h-full object-cover"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="w-full h-full bg-gradient-to-br ${getRandomGradient()} flex items-center justify-center text-white text-xl font-bold" style="display: none;">
                  ${getImageFallback()}
                </div>
              </div>
            </div>
            
            <!-- Enhanced Result Badge -->
            <div class="absolute -top-1 -right-1 w-10 h-10 rounded-full 
                 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm 
                 border-2 ${style.border} flex items-center justify-center text-xl shadow-xl
                 group-hover:scale-110 transition-transform duration-300">
              ${style.icon}
            </div>
          </div>
          
          <!-- Enhanced Player Name -->
          <div class="mb-4">
            <h3 class="text-white font-bold text-lg mb-1 truncate px-2 group-hover:${style.accent} transition-colors duration-300">
              ${opponent?.user?.fullName || opponent?.user?.nickname || 'Unknown Player'}
            </h3>
            <div class="w-12 h-0.5 bg-gradient-to-r ${style.border.replace('border-', 'from-')} ${style.border.replace('border-', 'to-')} mx-auto opacity-60"></div>
          </div>
          
          <!-- Enhanced Score Display -->
          <div class="mb-6">
            <div class="flex items-center justify-center space-x-6">
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">${userScore}</div>
                <div class="text-xs text-gray-300 uppercase tracking-wider font-semibold">You</div>
              </div>
              
              <div class="flex flex-col items-center">
                <div class="text-2xl text-gray-400 font-light mb-1">VS</div>
                <div class="w-8 h-0.5 bg-gradient-to-r from-gray-400 to-gray-600"></div>
              </div>
              
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">${opponentScore}</div>
                <div class="text-xs text-gray-300 uppercase tracking-wider font-semibold">Opponent</div>
              </div>
            </div>
          </div>
          
          <!-- Enhanced Result Status -->
          <div class="mb-4">
            <div class="inline-flex items-center px-4 py-2 rounded-full 
                 bg-gradient-to-r ${style.border.replace('border-', 'from-')} ${style.border.replace('border-', 'to-')}/20 
                 border border-current/30 backdrop-blur-sm">
              <span class="text-lg mr-2">${style.icon}</span>
              <span class="text-sm font-bold text-white uppercase tracking-wide">
                ${isDraw ? 'Draw' : isWinner ? 'Victory' : 'Defeat'}
              </span>
            </div>
          </div>
          
          <!-- Enhanced Game Number -->
          <div class="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Match #${gameNumber}
          </div>
          
          <!-- Bottom Accent Line -->
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${style.border.replace('border-', 'from-')} ${style.border.replace('border-', 'to-')} opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
    `;
  }

  renderErrorCard(gameId: string): string {
    return `
      <div class="relative overflow-hidden rounded-2xl 
           bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent 
           backdrop-filter backdrop-blur-xl border border-red-400/30 shadow-2xl
           hover:shadow-red-500/20 hover:border-red-400/50 
           transition-all duration-500 group cursor-pointer">
        
        <!-- Background Effects -->
        <div class="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 opacity-30"></div>
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-500 opacity-60"></div>
        
        <!-- Content -->
        <div class="relative z-10 p-6 text-center">
          <!-- Error Icon -->
          <div class="relative mb-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
              <span class="text-2xl">⚠️</span>
            </div>
          </div>
          
          <!-- Error Message -->
          <div class="mb-4">
            <h3 class="text-white font-bold text-lg mb-2">Error Loading Game</h3>
            <div class="w-12 h-0.5 bg-gradient-to-r from-red-400 to-red-500 mx-auto opacity-60"></div>
          </div>
          
          <!-- Game ID -->
          <div class="text-xs text-gray-400 font-medium uppercase tracking-wider">
            ID: ${gameId}
          </div>
          
          <!-- Bottom Accent Line -->
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
    `;
  }

  updateStatistics(totalGames: number, totalWins: number, totalLosses: number) {
    const elements = {
      totalGames: document.getElementById('total-games'),
      totalWins: document.getElementById('total-wins'),
      totalLosses: document.getElementById('total-losses')
    };

    if (elements.totalGames) elements.totalGames.textContent = String(totalGames);
    if (elements.totalWins) elements.totalWins.textContent = String(totalWins);
    if (elements.totalLosses) elements.totalLosses.textContent = String(totalLosses);
  }

  async processGameData(gamesData: any, user: any): Promise<{
    gameCards: string[];
    totalWins: number;
    totalLosses: number;
    trendData: number[];
  }> {
    if (!gamesData?.games?.length) {
      return { gameCards: [], totalWins: 0, totalLosses: 0, trendData: [] };
    }

    let totalWins = 0;
    let totalLosses = 0;
    let trendData: number[] = [];

    const gameCards = await Promise.all(
      gamesData.games.map(async (game: Game, index: number) => {
        try {
          const { participants }: { participants: GameParticipant[] } = await api.getGameParticipants(game.id);
          if (!participants.length) return '';

          const opponent = participants.find(p => p.userId !== user.id);
          if (!opponent) return '';

          const userParticipant = participants.find(p => p.userId === user.id);
          const userScore = userParticipant?.score ?? 0;
          const opponentScore = opponent.score ?? 0;
          const isWinner = userParticipant?.isWinner ?? false;
          const isDraw = participants.every(p => p.score === participants[0].score);

          // Update statistics
          if (isWinner) totalWins++;
          else if (!isDraw) totalLosses++;

          trendData.push(isWinner ? 1 : isDraw ? 0 : -1);

          // Get opponent info
          const opponentInfo = await this.getUserInfo(opponent.userId);

          return this.renderGameCard({
            opponent: opponentInfo,
            userScore,
            opponentScore,
            isWinner,
            isDraw,
            gameNumber: index + 1
          });

        } catch (error) {
          console.error(`Failed to process game ${game.id}:`, error);
          return this.renderErrorCard(game.id);
        }
      })
    );

    return {
      gameCards: gameCards.filter(card => card !== ''),
      totalWins,
      totalLosses,
      trendData
    };
  }
}