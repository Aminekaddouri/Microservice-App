import { DashboardConfig } from './DashboardConfig';
import { DashboardComponents } from './DashboardComponents';
import { i18n } from '@/services/i18n';

export class UserInfoRenderer {
  private config: DashboardConfig;
  private components: DashboardComponents;

  constructor(config: DashboardConfig) {
    this.config = config;
    this.components = new DashboardComponents(config);
  }

  async renderUserInfo(user: any) {
    console.log('UserInfoRenderer: renderUserInfo called with user:', user);
    const userInfoDiv = document.getElementById('user-info');
    console.log('UserInfoRenderer: user-info element found:', !!userInfoDiv);
    if (userInfoDiv) {
      console.log('UserInfoRenderer: user-info element classes:', userInfoDiv.className);
      console.log('UserInfoRenderer: user-info element style:', userInfoDiv.style.cssText);
    }
    if (!userInfoDiv || !user) {
      console.log('UserInfoRenderer: Early return - userInfoDiv:', !!userInfoDiv, 'user:', !!user);
      return;
    }

    const totalGamesNum = Number(document.getElementById('total-games')?.textContent) || 0;
    const totalWinsNum = Number(document.getElementById('total-wins')?.textContent) || 0;
    const ratio = totalGamesNum > 0 ? Math.round((totalWinsNum / totalGamesNum) * 100) : 0;

    const textColor = this.config.theme === 'light' ? 'text-gray-900' : 'text-white';
    
    // Enhanced user image handling with fallbacks
    const getUserImageSrc = () => {
      // Priority: 1. User uploaded image, 2. Google profile picture, 3. Default
      if (user.picture && user.picture !== '/default-avatar.png') {
        return user.picture;
      }
      if (user.googleId && user.googlePicture) {
        return user.googlePicture;
      }
      return '/default-avatar.png';
    };

    userInfoDiv.innerHTML = `
      <div class="flex flex-col xl:flex-row items-center justify-between space-y-6 sm:space-y-8 xl:space-y-0 xl:space-x-8 lg:xl:space-x-12 w-full">
        <!-- User Profile Section -->
        <div class="flex flex-col lg:flex-row items-center space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-6 xl:space-x-8 w-full xl:w-auto">
          <!-- Enhanced Profile Image -->
          <div class="relative group flex-shrink-0">
            <div class="absolute -inset-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <img src="${getUserImageSrc()}" 
                 alt="Profile" 
                 id="profile-image-clickable"
                 class="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl 
                        cursor-pointer transform transition-all duration-500 hover:scale-110 
                        backdrop-filter backdrop-blur-sm" 
                 onerror="this.src='/default-avatar.png'" />
            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <!-- Enhanced Status Indicator -->
            <div class="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full border-3 sm:border-4 border-white/30 shadow-xl flex items-center justify-center backdrop-filter backdrop-blur-sm">
              <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <!-- Enhanced User Details -->
          <div class="text-center lg:text-left w-full max-w-3xl space-y-3 sm:space-y-4">
            <div class="space-y-1 sm:space-y-2">
              <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-300 via-red-300 to-pink-300 bg-clip-text text-transparent break-words leading-tight">
                ${user.fullName || 'Player'}
              </h2>
              <p class="text-lg sm:text-xl md:text-2xl text-orange-300 font-semibold tracking-wide">@${user.nickName || 'Unknown'}</p>
            </div>
            
            <!-- Enhanced User Meta Information -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div class="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl bg-white/5 backdrop-filter backdrop-blur-sm border border-white/10">
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="text-left min-w-0 flex-1">
                  <p class="text-xs sm:text-sm text-gray-400 font-medium">${i18n.t('dashboard.joined')}</p>
                  <p class="text-sm sm:text-base text-gray-200 font-semibold truncate">${user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </div>
              
              <div class="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl bg-white/5 backdrop-filter backdrop-blur-sm border border-white/10">
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-green-400 to-teal-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                </div>
                <div class="text-left min-w-0 flex-1">
                  <p class="text-xs sm:text-sm text-gray-400 font-medium">${i18n.t('dashboard.email')}</p>
                  <p class="text-sm sm:text-base text-gray-200 font-semibold truncate">${user.email || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Win Rate Section -->
        <div class="flex-shrink-0 flex justify-center items-center w-full xl:w-auto">
          <div class="p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-filter backdrop-blur-sm border border-white/10">
            ${this.components.renderWinRateCircle(ratio)}
          </div>
        </div>
      </div>
    `;
    
    // Add click event listener for profile navigation
    const profileImage = document.getElementById('profile-image-clickable');
    if (profileImage) {
      profileImage.addEventListener('click', () => {
        import('../../utils/router').then(({ navigateTo }) => {
          navigateTo('/profile');
        });
      });
    }
  }
}