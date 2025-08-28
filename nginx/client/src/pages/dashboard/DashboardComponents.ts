import { DashboardConfig } from './DashboardConfig';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController, CategoryScale, LinearScale } from 'chart.js';
import { Game } from '@/types/game';
import { i18n } from '@/services/i18n';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController, CategoryScale, LinearScale);

export class DashboardComponents {
  private config: DashboardConfig;

  constructor(config: DashboardConfig) {
    this.config = config;
  }

  renderStatsCards(): string {
    const cards = [
      {
        id: 'total-games',
        title: i18n.t('dashboard.totalGames'),
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>`,
        gradient: 'from-orange-400 to-red-500',
        hoverColor: 'group-hover:text-orange-400'
      },
      {
        id: 'total-wins',
        title: i18n.t('dashboard.totalWins'),
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        gradient: 'from-green-400 to-emerald-500',
        hoverColor: 'group-hover:text-green-400'
      },
      {
        id: 'total-losses',
        title: i18n.t('dashboard.totalLosses'),
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        gradient: 'from-red-400 to-pink-500',
        hoverColor: 'group-hover:text-red-400'
      }
    ];

    return cards.map(card => `
      <div class="relative overflow-hidden rounded-2xl 
           bg-gradient-to-br from-white/10 via-white/5 to-transparent 
           backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl
           hover:shadow-${card.gradient.split('-')[1]}-500/20 hover:border-${card.gradient.split('-')[1]}-400/30 
           transition-all duration-500 group cursor-pointer
           before:absolute before:inset-0 before:bg-gradient-to-br before:${card.gradient.replace('to-', 'before:to-')}/5 before:rounded-2xl
           min-h-[200px] flex flex-col">
        <div class="relative z-10 p-4 sm:p-6 lg:p-8 text-center flex-1 flex flex-col justify-center">
          <!-- Enhanced Icon with Glow Effect -->
          <div class="flex items-center justify-center mb-4 sm:mb-6">
            <div class="relative">
              <div class="absolute -inset-2 bg-gradient-to-r ${card.gradient} rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
              <div class="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${card.gradient} flex items-center justify-center shadow-xl">
                <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  ${card.icon}
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Enhanced Typography -->
          <div class="space-y-2 sm:space-y-3">
            <h3 class="text-gray-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">${card.title}</h3>
            <p id="${card.id}" class="text-white text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold ${card.hoverColor} transition-colors duration-500">0</p>
          </div>
          
          <!-- Subtle Bottom Accent -->
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
    `).join('');
  }

  renderSessionSection(): string {
    return `
      <div class="w-full">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-900/40 via-orange-900/30 to-red-900/40 
             backdrop-filter backdrop-blur-xl border border-yellow-500/30 shadow-2xl p-4 sm:p-6 lg:p-8">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10"></div>
          <div class="relative">
            <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ${i18n.t('dashboard.gameSessionsOverview')}
            </h2>
            <div id="session-stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"></div>
            <div id="session-placeholder" class="hidden text-center py-8 sm:py-12">
              <div class="text-4xl sm:text-6xl mb-4">⏱️</div>
              <h3 class="text-lg sm:text-xl font-semibold text-gray-300 mb-2">${i18n.t('dashboard.noSessionData')}</h3>
              <p class="text-sm sm:text-base text-gray-400">${i18n.t('dashboard.startPlayingToTrack')}</p>
            </div>
            <button id="session-see-more-btn" 
                    class="mt-6 sm:mt-8 px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full 
                           hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 
                           transition-all duration-300 mx-auto block hidden font-semibold shadow-xl
                           border border-yellow-400/30 hover:border-yellow-300/50 text-sm sm:text-base">
              Load More Sessions
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderWinRateCircle(ratio: number): string {
    const strokeDashoffset = 276 - (ratio * 2.76);

    return `
      <div class="win-rate-circle relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="50%" cy="50%" r="44" stroke="#e5e7eb" stroke-width="6" fill="transparent"/>
          <circle cx="50%" cy="50%" r="44" stroke="#4f46e5" stroke-width="6" fill="transparent"
            stroke-dasharray="276" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">${ratio}%</span>
          <span class="text-xs sm:text-xs lg:text-sm text-gray-300">${i18n.t('dashboard.winRate')}</span>
        </div>
      </div>
    `;
  }

  renderTrendChart(trendData: number[]) {
    // Add a small delay to ensure canvas is properly mounted
    setTimeout(() => {
      const canvas = document.getElementById('trend-chart') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) {
        console.warn('Canvas context not available for chart rendering');
        return;
      }
      
      this.doRenderChart(canvas, ctx, trendData);
    }, 100);
  }

  private doRenderChart(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, trendData: number[]) {

    // Calculate statistics
    const wins = trendData.filter(val => val === 1).length;
    const losses = trendData.filter(val => val === -1).length;
    const draws = trendData.filter(val => val === 0).length;
    const totalGames = wins + losses + draws;

    // Handle empty state
    if (totalGames === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No games played yet', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Prepare chart data
    const chartData = [];
    const chartLabels = [];
    const chartColors = [];

    if (wins > 0) {
      chartData.push(wins);
      chartLabels.push(`Wins (${wins})`);
      chartColors.push('#10B981');
    }

    if (losses > 0) {
      chartData.push(losses);
      chartLabels.push(`Losses (${losses})`);
      chartColors.push('#EF4444');
    }

    if (draws > 0) {
      chartData.push(draws);
      chartLabels.push(`Draws (${draws})`);
      chartColors.push('#6B7280');
    }

    const winRate = Math.round((wins / totalGames) * 100);

    try {
      // Destroy any existing chart on this canvas
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: chartLabels,
          datasets: [{
            data: chartData,
            backgroundColor: chartColors,
            borderColor: chartColors.map(color => color + 'CC'),
            borderWidth: 2,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: this.config.theme === 'light' ? '#374151' : '#D1D5DB',
                font: { size: 12 },
                padding: 15
              }
            }
          },
          cutout: '70%'
        },
        plugins: [{
          id: 'centerText',
          beforeDraw: (chart: { ctx: any; chartArea: { left: any; right: any; top: any; bottom: any; }; }) => {
            const ctx = chart.ctx;
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.config.theme === 'light' ? '#1F2937' : '#F9FAFB';

            // Total games
            ctx.font = 'bold 24px Arial';
            ctx.fillText(totalGames.toString(), centerX, centerY - 15);

            // Win rate
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = winRate >= 50 ? '#10B981' : '#EF4444';
            ctx.fillText(`${winRate}%`, centerX, centerY + 15);

            ctx.restore();
          }
        }]
      });
    } catch (error) {
      console.error('Error rendering chart:', error);
      // Fallback rendering for chart errors
      ctx.fillStyle = '#EF4444';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Error rendering chart. Please refresh.', canvas.width / 2, canvas.height / 2);
    }
  }
}