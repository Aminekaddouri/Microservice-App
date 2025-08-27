import { loadingIndicator, showToast } from '@/utils/utils';
import { logout, isLoggedIn, isEmailVerificationChecked, setEmailVerificationChecked, getCachedVerificationStatus } from '../../utils/auth';
import { navigateTo } from '../../utils/router';
import { checkEmailVerification } from '../LoginPage';
import { getCurrentUser } from '@/utils/authState';
import { api } from '@/services/api';
import { DashboardConfig } from './DashboardConfig';
import { DashboardComponents } from './DashboardComponents';
import { GameUtils } from './GameUtils';
import { UserInfoRenderer } from './UserInfoRenderer';
import { SessionStatsRenderer } from './SessionStatsRenderer';
import { i18n } from '@/services/i18n';

export class DashboardManager {
  private config: DashboardConfig;
  private app: HTMLElement | null;
  private gamesList: HTMLElement | null = null;
  private seeMoreBtn: HTMLButtonElement | null = null;
  private visibleMatches: number;
  private allGameCards: string[] = [];
  private gamesData: any = null;
  private user: any = null;
  
  // Component instances
  private components: DashboardComponents;
  private gameUtils: GameUtils;
  private userInfoRenderer: UserInfoRenderer;
  private sessionStatsRenderer: SessionStatsRenderer;

  constructor(config: DashboardConfig) {
    this.config = config;
    this.app = document.getElementById("app");
    this.visibleMatches = config.matchesPerPage;
    
    // Initialize component instances
    this.components = new DashboardComponents(config);
    this.gameUtils = new GameUtils(config);
    this.userInfoRenderer = new UserInfoRenderer(config);
    this.sessionStatsRenderer = new SessionStatsRenderer(config);
    
    // Subscribe to language changes
    i18n.onLanguageChange(() => {
      this.updateTranslations();
    });
  }

  async initialize() {
    if (!this.app) {
      console.error('App container not found');
      return;
    }

    try {
      // Show loading state
      this.app.innerHTML = loadingIndicator;

      // Validate user
      this.user = getCurrentUser();
      if (!this.user?.id) {
        navigateTo('/');
        return;
      }

      // Check email verification
      const isVerified = await checkEmailVerification(this.user.id);
      if (!isVerified) {
        navigateTo('/check-your-email');
        return;
      }

      // Render layout
      this.renderLayout();

      // Initialize components
      this.initializeElements();

      // Load and render data
      await this.loadGameData();

      // Setup event listeners
      this.setupEventListeners();

      // Render all components
      await this.renderAllComponents();

    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      this.renderError('Failed to load dashboard. Please refresh the page.');
    }
  }

  private renderLayout() {
    if (!this.app) return;

    this.app.innerHTML = `
  <div class="min-h-screen bg-transparent text-white overflow-x-hidden">
    <!-- Enhanced Header with Profile Page Consistency -->
    <div class="relative overflow-hidden bg-gradient-to-br from-orange-500/20 via-red-500/20 rounded-xl to-pink-500/20 
         backdrop-filter backdrop-blur-xl border-b border-orange-400/40 shadow-2xl mb-8">
      <div class="absolute inset-0 bg-gradient-to-r from-orange-400/15 to-red-400/15"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div class="text-center space-y-4">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-300 via-red-300 to-pink-300 bg-clip-text text-transparent mb-6 tracking-tight">
            ${i18n.t('nav.dashboard')}
          </h1>
          <p class="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto font-medium">
            ${i18n.t('dashboard.welcome')}, Champion! 🏆
          </p>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">

      <!-- Enhanced User Info Section with Glass Morphism -->
      ${this.config.showUserInfo ? `
        <div id="user-info" class="relative overflow-hidden rounded-3xl w-full 
             bg-gradient-to-br from-white/10 via-white/5 to-transparent 
             backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl p-8 sm:p-10
             hover:shadow-orange-500/20 hover:border-orange-400/30 transition-all duration-500
             before:absolute before:inset-0 before:bg-gradient-to-br before:from-orange-500/5 before:to-red-500/5 before:rounded-3xl">
          <div class="relative z-10">
            <!-- User info content will be rendered here -->
          </div>
        </div>
      ` : ''}

      <!-- Enhanced Summary Cards with Better Spacing -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-10">
        ${this.components.renderStatsCards()}
      </div>

      <!-- Enhanced Chart Section with Glass Morphism -->
      ${this.config.showChart ? `
        <div class="chart-container relative overflow-hidden rounded-3xl w-full 
             bg-gradient-to-br from-white/10 via-white/5 to-transparent 
             backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl
             hover:shadow-blue-500/20 hover:border-blue-400/30 transition-all duration-500
             before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5 before:rounded-3xl">
          <div class="relative z-10 p-8 sm:p-10">
            <div class="text-center mb-8">
              <h2 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-3">
                ${i18n.t('dashboard.statistics')}
              </h2>
              <div class="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
            </div>
            <div class="h-72 sm:h-80 flex justify-center">
              <canvas id="trend-chart"></canvas>
            </div>
            <div id="chart-placeholder" class="hidden h-72 sm:h-80 flex flex-col items-center justify-center text-center">
              <div class="text-7xl mb-6 opacity-60">📊</div>
              <h3 class="text-2xl font-semibold text-gray-200 mb-3">${i18n.t('dashboard.noRecentGames')}</h3>
              <p class="text-gray-400 text-lg">${i18n.t('dashboard.playNow')}</p>
            </div>
          </div>
        </div>
      ` : ''}

       <!-- Enhanced Recent Matches with Glass Morphism -->
       <div class="w-full">
         <div class="relative overflow-hidden rounded-3xl 
              bg-gradient-to-br from-white/10 via-white/5 to-transparent 
              backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl
              hover:shadow-green-500/20 hover:border-green-400/30 transition-all duration-500
              before:absolute before:inset-0 before:bg-gradient-to-br before:from-green-500/5 before:to-teal-500/5 before:rounded-3xl">
           <div class="relative z-10 p-8 sm:p-10">
             <div class="text-center mb-8">
               <h2 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent mb-3">
                 ${i18n.t('dashboard.recentGames')}
               </h2>
               <div class="w-16 h-1 bg-gradient-to-r from-green-400 to-teal-400 mx-auto rounded-full"></div>
             </div>
             <div id="games-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"></div>
             <div id="matches-placeholder" class="hidden text-center py-16">
               <div class="text-7xl mb-6 opacity-60">🎮</div>
               <h3 class="text-2xl font-semibold text-gray-200 mb-3">${i18n.t('dashboard.noRecentGames')}</h3>
               <p class="text-gray-400 text-lg">${i18n.t('dashboard.playNow')}</p>
             </div>
             <button id="see-more-btn" 
                     class="mt-8 px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full 
                            hover:from-orange-600 hover:to-red-600 transform hover:scale-105 
                            transition-all duration-300 mx-auto block hidden font-semibold shadow-xl
                            border border-orange-400/30 hover:border-orange-300/50">
               ${i18n.t('dashboard.loadMoreMatches')}
             </button>
           </div>
         </div>
       </div>

       <!-- Enhanced Session Stats -->
       <div class="w-full">
         ${this.config.showSessionStats ? this.components.renderSessionSection() : ''}
       </div>
     </div>
   </div>
 `;
  }

  private initializeElements() {
    this.gamesList = document.getElementById("games-list");
    this.seeMoreBtn = document.getElementById("see-more-btn") as HTMLButtonElement;
  }

  private async loadGameData() {
    if (!this.user?.id) throw new Error('No user ID available');

    try {
      this.gamesData = await api.getusergames(this.user.id);
      const games = this.gamesData?.games || [];

      const chartCanvas = document.getElementById('trend-chart') as HTMLCanvasElement;
      const chartPlaceholder = document.getElementById('chart-placeholder');

      if (games.length === 0) {
        if (this.gamesList) {
          this.gamesList.innerHTML = `
            <div class="col-span-full text-center text-gray-500 p-8">
              <div class="text-6xl mb-4">🎮</div>
              <p class="text-xl">${i18n.t('dashboard.noGamesFound')}</p>
              <p class="text-sm mt-2">${i18n.t('dashboard.playFirstGame')}</p>
            </div>
          `;
        }
        chartPlaceholder?.classList.remove('hidden');
        chartCanvas?.classList.add('hidden');
      } else {
        await this.processGameData();
        chartPlaceholder?.classList.add('hidden');
        chartCanvas?.classList.remove('hidden');
      }

    } catch (error) {
      console.error("Failed to fetch user games:", error);
      throw error;
    }
  }

  private async processGameData() {
    if (!this.gamesData?.games?.length || !this.gamesList) return;

    const result = await this.gameUtils.processGameData(this.gamesData, this.user);
    this.allGameCards = result.gameCards;

    // Update UI with statistics
    this.gameUtils.updateStatistics(this.gamesData.games.length, result.totalWins, result.totalLosses);

    // Render components
    this.renderMatches();

    if (this.config.showChart) {
      this.components.renderTrendChart(result.trendData);
    }
  }

  private renderMatches() {
    if (!this.gamesList || !this.seeMoreBtn) return;

    const matchesPlaceholder = document.getElementById('matches-placeholder');
    
    // Show/hide placeholder based on whether there are games
    if (this.allGameCards.length === 0) {
      this.gamesList.innerHTML = '';
      matchesPlaceholder?.classList.remove('hidden');
      this.seeMoreBtn.classList.add('hidden');
    } else {
      matchesPlaceholder?.classList.add('hidden');
      this.gamesList.innerHTML = this.allGameCards.slice(0, this.visibleMatches).join('');
      this.seeMoreBtn.classList.toggle('hidden', this.visibleMatches >= this.allGameCards.length);

      // Update button text
      if (this.visibleMatches < this.allGameCards.length) {
        const remaining = this.allGameCards.length - this.visibleMatches;
        this.seeMoreBtn.textContent = `${i18n.t('common.next')} (${remaining} remaining)`;
      }
    }
  }

  private setupEventListeners() {
    // See more button
    this.seeMoreBtn?.addEventListener('click', () => {
      this.visibleMatches += this.config.matchesPerPage;
      this.renderMatches();
    });

    // Navigation buttons
    document.getElementById('profile')?.addEventListener('click', () => {
      navigateTo('/profile');
    });

    document.getElementById('chat-btn')?.addEventListener('click', () => {
      navigateTo('/chat');
    });

    document.getElementById('logout')?.addEventListener('click', () => {
      logout();
      showToast(i18n.t('auth.logoutSuccessful'), "success");
      navigateTo('/');
    });
  }

  private async renderAllComponents() {
    // Render user info
    console.log('DashboardManager: showUserInfo config:', this.config.showUserInfo);
    console.log('DashboardManager: user data:', this.user);
    console.log('DashboardManager: user-info element exists:', !!document.getElementById('user-info'));
    if (this.config.showUserInfo) {
      await this.userInfoRenderer.renderUserInfo(this.user);
    }

    // Update statistics cards
    if (this.gamesData?.games?.length) {
      const totalGames = this.gamesData.games.length;
      const totalWins = this.gamesData.games.filter((game: any) => game.winner_id === this.user.id).length;
      const totalLosses = this.gamesData.games.filter((game: any) => game.loser_id === this.user.id).length;
      this.gameUtils.updateStatistics(totalGames, totalWins, totalLosses);
    } else {
      this.gameUtils.updateStatistics(0, 0, 0);
    }

    // Render chart with placeholder toggle
    const chartContainer = document.getElementById('trend-chart');
    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (this.config.showChart && chartContainer) {
      if (this.gamesData?.games?.length) {
        const trendData = this.gamesData.games.map((game: any) => {
          if (game.winner_id === this.user.id) return 1;
          if (game.loser_id === this.user.id) return -1;
          return 0;
        });
        this.components.renderTrendChart(trendData);
        chartPlaceholder?.classList.add('hidden');
        chartContainer.parentElement?.classList.remove('hidden');
      } else {
        chartPlaceholder?.classList.remove('hidden');
        chartContainer.parentElement?.classList.add('hidden');
      }
    }

    // Render session stats with placeholder toggle
    const sessionStats = document.getElementById('session-stats');
    const sessionPlaceholder = document.getElementById('session-placeholder');
    if (this.config.showSessionStats) {
      if (this.gamesData?.games?.length) {
        await this.sessionStatsRenderer.renderSessionStats(this.gamesData.games);
        sessionPlaceholder?.classList.add('hidden');
        sessionStats?.classList.remove('hidden');
      } else {
        sessionPlaceholder?.classList.remove('hidden');
        sessionStats?.classList.add('hidden');
      }
    }

    // Render matches
    this.renderMatches();
  }

  private renderError(message: string) {
    if (!this.app) return;
    
    this.app.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-red-500 mb-2">${i18n.t('common.error')}</h2>
          <p class="text-gray-600">${message}</p>
          <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            ${i18n.t('common.refreshPage')}
          </button>
        </div>
      </div>
    `;
  }

  private updateTranslations() {
    // Re-render the layout with new translations
    this.renderLayout();
  }
}