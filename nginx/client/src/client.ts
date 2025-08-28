import { renderDashboard } from './pages/DashboardPage';
import { renderLogin, setupLoginEvents } from './pages/LoginPage';
import './styles/merged.css';
import dotenv from "dotenv";
import { navigateTo, registerRoute, renderRoute } from './utils/router';
import { isLoggedIn, logout, verifyToken } from './utils/auth';
import { renderSignup } from './pages/SignupPage';
import { renderCheckYourEmailPage } from './pages/CheckYourEmailPage';
import { setCurrentUser, getCurrentUser } from './utils/authState';
import { initChat, setupSidebarNotificationEvents, totalNotifications, setupAddUserModal, globalFriendUsers } from './pages/ChatPage'
import { renderGame } from './pages/GamePage'
import { renderTournament } from './pages/tournamentPage'
import { renderFriendGame } from './pages/friendGame'
// import { initChat } from './pages/ChatPage';
import { renderProfile } from './pages/ProfilePage';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { i18n } from './services/i18n';
import { navigationManager } from './utils/NavigationManager';

// Make i18n available globally for debugging and access
(window as any).i18n = i18n;

// New: public routes list and helpers to build/show the app shell dynamically
const publicRoutes = ['/login', '/signup', '/check-your-email'];

function buildShellHTML(): string {
  return `
    <div class="home-page relative min-h-screen" style="background: black url('https://c.animaapp.com/meowft3dpQO6a0/img/1920-1080-2.png') no-repeat center center/contain;">
      <!-- Mobile Bottom Navigation (visible on mobile only) -->
      <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20">
        <div class="flex items-center justify-around px-4 py-2">
          <button id="home-btn-mobile" aria-label="Home" class="flex flex-col items-center p-3 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
            </svg>
            <span class="text-xs font-medium">${i18n.t('nav.dashboard')}</span>
          </button>
          <button id="mode-1-btn-mobile" aria-label="Chat" class="flex flex-col items-center p-3 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span class="text-xs font-medium">${i18n.t('nav.chat')}</span>
          </button>
          <button id="mode-2-btn-mobile" aria-label="Game" class="flex flex-col items-center p-3 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-xs font-medium">${i18n.t('game.classic')}</span>
          </button>
          
        </div>
      </nav>

      <!-- Desktop Sidebar (floating pill-shaped) -->
      <aside class="hidden md:fixed md:flex z-40 top-1/2 -translate-y-1/2" style="left: 24px;">
        <nav class="flex flex-col items-center gap-6 px-3 py-5 rounded-3xl bg-gray-300/50 backdrop-blur-md">
          <button id="home-btn" aria-label="Home" class="w-11 h-11 rounded-2xl bg-black/35 hover:bg-orange-700 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group">
            <svg class="w-5 h-5 text-white group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
            </svg>
          </button>
          <button id="mode-1-btn" aria-label="Chat" class="w-11 h-11 rounded-2xl bg-black/35 hover:bg-orange-700 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group">
            <svg class="w-5 h-5 text-white group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button id="mode-2-btn" aria-label="Game" class="w-11 h-11 rounded-2xl bg-black/35 hover:bg-orange-700 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group">
            <svg class="w-5 h-5 text-white group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button id="settings-btn" aria-label="Settings" class="w-11 h-11 rounded-2xl bg-black/35 hover:bg-orange-700 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group">
            <svg class="w-5 h-5 text-white group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button id="logout-btn" aria-label="Logout" class="w-11 h-11 rounded-2xl bg-black/35 hover:bg-orange-700 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group">
            <svg class="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" style="filter: brightness(0) invert(1);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
          </button>
        </nav>
      </aside>

      <!-- Fixed Header Bar -->
      <header class="fixed top-0 right-0 left-32 h-16 bg-black/20 backdrop-blur-md border-b border-white/10 z-40 flex items-center justify-end px-6">
        <div class="flex items-center gap-4">
          <!-- Search, Language Switcher, and Notification Buttons -->
          <div class="flex items-center gap-3">
            <button 
              id="search-toggle-sidebar" 
              aria-label="Search" 
              class="w-11 h-11 rounded-xl bg-white/10 hover:bg-orange-500/80 border border-white/20 hover:border-orange-400/50 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group"
            >
              <svg class="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke-width="1.8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="1.8" stroke-linecap="round"></line>
              </svg>
            </button>
            
            <!-- Language Switcher -->
            <div id="language-switcher-container"></div>
            
            <button 
              id="notification-toggle-sidebar" 
              aria-label="Notifications" 
              class="relative w-11 h-11 rounded-xl bg-white/10 hover:bg-orange-500/80 border border-white/20 hover:border-orange-400/50 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400/50 group"
            >
              <svg class="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <!-- Dynamic Profile Image -->
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur-sm"></div>
            <img 
              id="header-profile-image" 
              class="relative w-12 h-12 rounded-full object-cover border-2 border-white/30 cursor-pointer transition-all duration-300 hover:scale-105" 
              src="/default-avatar.png" 
              alt="User Profile"
              onclick="navigateTo('/profile')"
            />
            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </header>

      <!-- Fixed Central Container for Page Content -->
      <main class="pb-20 md:pb-0 flex justify-center items-start pt-20 h-screen pl-5 pr-6 ml-30 overflow-hidden">
          <div id="app" class="w-full max-w-6xl mx-auto p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-y-auto overflow-x-hidden" style="height: calc(100vh - 96px); max-height: calc(100vh - 96px); contain: layout style;"></div>
        </main>
    </div>
  `;
}

function updateHeaderProfileImage() {
  const currentUser = getCurrentUser();
  const headerProfileImage = document.getElementById('header-profile-image') as HTMLImageElement;
  
  if (headerProfileImage && currentUser) {
    // Priority: 1. User uploaded image, 2. Default avatar
    let imageSrc = '/default-avatar.png';
    
    if (currentUser.picture && currentUser.picture !== '/default-avatar.png') {
      imageSrc = currentUser.picture;
    }
    
    headerProfileImage.src = imageSrc;
    headerProfileImage.onerror = () => {
      headerProfileImage.src = '/default-avatar.png';
    };
  }
}

function setupShellEnhancements() {
  // Update dynamic profile image
  updateHeaderProfileImage();
  
  // Initialize language switcher
  const languageSwitcherContainer = document.getElementById('language-switcher-container');
  if (languageSwitcherContainer) {
    const languageSwitcher = new LanguageSwitcher(languageSwitcherContainer, {
      onLanguageChange: async (language) => {
        // Refresh the page content when language changes
        console.log(`Language changed to: ${language}`);
        // Re-render the current route to apply new translations
        const currentPath = window.location.pathname;
        await renderRoute(currentPath);
      }
    });
  }
  
  // Setup notification icon content with badge
  const notButton = document.getElementById('notification-toggle-sidebar');
  if (notButton) {
    // Add notification badge if there are notifications
    const badgeHTML = totalNotifications > 0 ? `<span class="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-semibold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-md">${totalNotifications > 99 ? '99+' : totalNotifications}</span>` : '';
    if (badgeHTML && !notButton.querySelector('span')) {
      notButton.insertAdjacentHTML('beforeend', badgeHTML);
    }
  }

  // Add the enhanced modal to the document body if not exists
  const existingModal = document.getElementById('add-user-modal');
  if (!existingModal) {
    const modalHTML = `
      <div id="add-user-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-in fade-in duration-300">
        <div class="relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-[90vw] sm:max-w-[480px] mx-4 max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-white/30 shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100">
          <!-- Gradient overlay for glass effect -->
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10 rounded-3xl pointer-events-none"></div>
          
          <!-- Modal Header -->
          <div class="relative flex justify-between items-center mb-6">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur opacity-75"></div>
                <div class="relative bg-gradient-to-r from-orange-500 to-red-500 p-2.5 rounded-full">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800">${i18n.t('chat.addNewFriend')}</h3>
        <p class="text-sm text-gray-600">${i18n.t('chat.discoverAndConnect')}</p>
              </div>
            </div>
            <button id="close-modal-btn" class="group relative p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-full hover:bg-gray-100/50">
              <svg class="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Enhanced Notification Area -->
          <div id="modal-notification-area" class="mb-4 hidden">
            <div id="modal-notification" class="p-4 rounded-2xl flex items-center space-x-3 text-sm backdrop-blur-sm border border-white/20 shadow-lg">
              <div id="notification-icon" class="flex-shrink-0"></div>
              <div id="notification-message" class="font-medium flex-1"></div>
            </div>
          </div>

          <!-- Enhanced Search Input -->
          <div class="mb-4 sm:mb-6">
            <div class="relative group">
              <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <div class="relative">
                <svg class="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="Search by name, email, or username..." 
                  class="w-full pl-10 sm:pl-12 pr-12 sm:pr-16 py-3 sm:py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-gray-700 placeholder-gray-400 shadow-sm hover:shadow-md text-sm sm:text-base"
                />
                <div class="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                  <div class="hidden" id="search-loading">
                    <div class="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                  <div class="text-xs text-gray-400 hidden sm:block">${i18n.t('chat.enterToSearch')}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Search Results -->
          <div class="flex-1 min-h-0">
            <div id="search-results" class="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              <div class="text-center py-8 sm:py-12 text-gray-500">
                <div class="relative mb-3 sm:mb-4">
                  <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-full blur"></div>
                  <div class="relative bg-gradient-to-r from-orange-100 to-blue-100 p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                    <svg class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                </div>
                <h4 class="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">${i18n.t('chat.startYourSearch')}</h4>
                <p class="text-xs sm:text-sm text-gray-500">Type a name or email to find new friends</p>
              </div>
            </div>
          </div>

          <!-- Enhanced Footer Stats -->
          <div class="mt-4 sm:mt-6 pt-4 border-t border-gray-200/50">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span id="search-stats" class="text-xs sm:text-sm font-medium text-gray-600">${i18n.t('chat.readyToSearch')}</span>
              </div>
              <div class="flex items-center space-x-2 bg-gray-100/50 rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
                <span id="friend-count" class="text-xs sm:text-sm font-medium text-gray-700">${globalFriendUsers.length} friends</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}

registerRoute('/login', renderLogin);
registerRoute('/signup', renderSignup);
registerRoute('/check-your-email', renderCheckYourEmailPage);
registerRoute('/', renderDashboard);
registerRoute('/dashboard', renderDashboard);
registerRoute('/chat', initChat);
registerRoute('/game', renderGame);
registerRoute('/tournament', renderTournament);
registerRoute('/friendGame', renderFriendGame);
// registerRoute('/chat', initChat);
registerRoute('/profile', renderProfile);

async function initApp() {
  // Initialize i18n service first
  await i18n.waitForTranslations();
  
  const currentPath = location.pathname;

  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    setCurrentUser(JSON.parse(storedUser));
  }

  const isPublic = publicRoutes.includes(currentPath);
  if (!isPublic) {
    const isValid = await verifyToken();
    if (!isValid) {
      return navigateTo('/login');
    }
    return await renderRoute(currentPath);
  }

  // If we're at the root path and user is logged in, redirect to dashboard
  if (currentPath === '/' && isLoggedIn()) {
    return navigateTo('/dashboard');
  }

  // Public route: render the route (NavigationManager handles shell state)
  return await renderRoute(currentPath);
}

initApp();

// Enhanced listeners for both desktop and mobile navigation
function initListeners() {
  // Home buttons (desktop and mobile)
  document.getElementById('home-btn')?.addEventListener('click', async () => {
    navigateTo('/');
  });
  document.getElementById('home-btn-mobile')?.addEventListener('click', async () => {
    navigateTo('/');
  });

  // Chat buttons (desktop and mobile)
  document.getElementById('mode-1-btn')?.addEventListener('click', () => {
    navigateTo('/chat');
  });
  document.getElementById('mode-1-btn-mobile')?.addEventListener('click', () => {
    navigateTo('/chat');
  });

  // Game buttons (desktop and mobile)
  document.getElementById('mode-2-btn')?.addEventListener('click', () => {
    navigateTo('/game');
  });
  document.getElementById('mode-2-btn-mobile')?.addEventListener('click', () => {
    navigateTo('/game');
  });

  // Tournament buttons (desktop and mobile)
  document.getElementById('mode-3-btn')?.addEventListener('click', () => {
    navigateTo('/tournament');
  });
  document.getElementById('mode-3-btn-mobile')?.addEventListener('click', () => {
    navigateTo('/tournament');
  });

  // Settings button (desktop only - mobile users can access via profile)
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    navigateTo('/profile');
  });

  // Logout button (desktop only) - Use NavigationManager for consistent behavior
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    navigationManager.handleLogout();
  });

  // Header action buttons
  document.getElementById('search-toggle-sidebar')?.addEventListener('click', () => {
    setupAddUserModal(); 
  });

  document.getElementById('notification-toggle-sidebar')?.addEventListener('click', () => {
    setupSidebarNotificationEvents();
  });
}

// NavigationManager now handles shell state management through the router

