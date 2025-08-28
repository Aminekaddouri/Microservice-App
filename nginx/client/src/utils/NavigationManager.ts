import { logout, isLoggedIn } from './auth';
import { navigateTo } from './router';
import { clearCurrentUser } from './authState';
import { i18n } from '../services/i18n';

/**
 * NavigationManager handles consistent navigation behavior,
 * logout confirmation, and shell state management
 */
export class NavigationManager {
  private static instance: NavigationManager;
  private isLoggingOut = false;

  private constructor() {}

  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  /**
   * Handles logout with consistent confirmation dialog
   * @param skipConfirmation - Skip confirmation dialog (for forced logouts)
   */
  public async handleLogout(skipConfirmation = false): Promise<void> {
    if (this.isLoggingOut) {
      return; // Prevent multiple simultaneous logout attempts
    }
    
    // Set flag immediately to prevent multiple dialogs
    this.isLoggingOut = true;

    let shouldLogout = skipConfirmation;
    
    if (!skipConfirmation) {
      shouldLogout = await this.showLogoutConfirmation();
    }

    if (shouldLogout) {
      try {
        await this.performLogout();
      } finally {
        this.isLoggingOut = false;
      }
    } else {
      // Reset flag if user cancels logout
      this.isLoggingOut = false;
    }
  }

  /**
   * Shows a consistent logout confirmation dialog
   */
  private async showLogoutConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = this.createConfirmationModal();
      document.body.appendChild(modal);

      const confirmBtn = modal.querySelector('#confirm-logout');
      const cancelBtn = modal.querySelector('#cancel-logout');
      const closeBtn = modal.querySelector('#close-logout-modal');

      let isResolved = false;
      
      const cleanup = () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', handleEscape);
      };

      const resolveOnce = (value: boolean) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(value);
        }
      };

      confirmBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resolveOnce(true);
      });

      cancelBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resolveOnce(false);
      });

      closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resolveOnce(false);
      });

      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          resolveOnce(false);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          resolveOnce(false);
        }
      });
    });
  }

  /**
   * Creates the logout confirmation modal
   */
  private createConfirmationModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300';
    modal.innerHTML = `
      <div class="relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl p-6 w-full max-w-md mx-4 border border-white/30 shadow-2xl transform transition-all duration-300">
        <!-- Gradient overlay for glass effect -->
        <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 rounded-3xl pointer-events-none"></div>
        
        <!-- Modal Header -->
        <div class="relative flex justify-between items-center mb-6">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur opacity-75"></div>
              <div class="relative bg-gradient-to-r from-red-500 to-orange-500 p-2.5 rounded-full">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800">${i18n.t('common.confirmLogout') || 'Confirm Logout'}</h3>
              <p class="text-sm text-gray-600">${i18n.t('common.logoutMessage') || 'Are you sure you want to sign out?'}</p>
            </div>
          </div>
          <button id="close-logout-modal" class="group relative p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-full hover:bg-gray-100/50">
            <svg class="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="relative space-y-6">
          <div class="bg-orange-50/80 border border-orange-200/50 rounded-xl p-4 flex items-start space-x-3">
            <svg class="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p class="text-orange-800 text-sm font-medium">${i18n.t('common.logoutWarning') || 'You will be signed out of your account'}</p>
              <p class="text-orange-700 text-xs mt-1">${i18n.t('common.logoutNote') || 'You can sign back in anytime with your credentials'}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button 
              id="cancel-logout"
              class="flex-1 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-xl py-3 px-4 transition-all duration-300 border border-gray-200/50 font-medium"
            >
              ${i18n.t('common.cancel') || 'Cancel'}
            </button>
            <button 
              id="confirm-logout"
              class="flex-1 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg border border-red-400/30 font-medium"
            >
              ${i18n.t('common.signOut') || 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  /**
   * Performs the actual logout process
   */
  private async performLogout(): Promise<void> {
    try {
      // Clear authentication state immediately to prevent UI inconsistencies
      clearCurrentUser();
      
      // Hide shell immediately
      this.hideShell();
      
      // Perform logout API call
      await logout();
      
      // Navigate to login page
      navigateTo('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, still redirect to login
      navigateTo('/login');
    }
  }

  /**
   * Immediately hides the shell to prevent inconsistent states
   */
  private hideShell(): void {
    const root = document.getElementById('root');
    if (root) {
      const shellExists = !!document.querySelector('.home-page');
      if (shellExists) {
        root.innerHTML = '<div id="app"></div>';
      }
    }
  }

  /**
   * Ensures proper shell visibility based on authentication state
   */
  public ensureShellState(path: string, loggedIn: boolean): void {
    const root = document.getElementById('root');
    if (!root) return;

    const publicRoutes = ['/login', '/signup', '/check-your-email'];
    const shouldShowShell = loggedIn && !publicRoutes.includes(path);
    const shellExists = !!document.querySelector('.home-page');

    if (shouldShowShell && !shellExists) {
      this.buildAndShowShell();
    } else if (!shouldShowShell && shellExists) {
      root.innerHTML = '<div id="app"></div>';
    }
  }

  /**
   * Builds and shows the shell with proper event listeners
   */
  private buildAndShowShell(): void {
    const root = document.getElementById('root');
    if (!root) return;

    root.innerHTML = this.getShellHTML();
    // Use setTimeout to ensure DOM is ready before setting up listeners
    setTimeout(() => {
      this.initializeShellListeners();
      this.setupShellEnhancements();
    }, 0);
  }

  /**
   * Gets the shell HTML (extracted from client.ts)
   */
  private getShellHTML(): string {
    return `
      <div class="home-page relative min-h-screen" style="background: black url('https://c.animaapp.com/meowft3dpQO6a0/img/1920-1080-2.png') no-repeat center center/contain;">
        <!-- Mobile Bottom Navigation (visible on mobile only) -->
        <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20">
          <div class="flex items-center justify-around px-2 py-2">
            <button id="home-btn-mobile" aria-label="Home" class="flex flex-col items-center p-2 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
              </svg>
              <span class="text-xs font-medium">${i18n.t('nav.dashboard')}</span>
            </button>
            <button id="mode-1-btn-mobile" aria-label="Chat" class="flex flex-col items-center p-2 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span class="text-xs font-medium">${i18n.t('nav.chat')}</span>
            </button>
            <button id="mode-2-btn-mobile" aria-label="Game" class="flex flex-col items-center p-2 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs font-medium">${i18n.t('game.classic')}</span>
            </button>
            <button id="profile-btn-mobile" aria-label="Profile" class="flex flex-col items-center p-2 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-xs font-medium">${i18n.t('nav.profile')}</span>
            </button>
            <button id="logout-btn-mobile" aria-label="Logout" class="flex flex-col items-center p-2 rounded-xl text-orange-400 hover:text-orange-300 transition-all duration-300 hover:bg-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
              <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              <span class="text-xs font-medium">${i18n.t('nav.logout')}</span>
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
              <svg class="w-5 h-5 text-white group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  /**
   * Initializes shell event listeners
   */
  private initializeShellListeners(): void {
    // Home buttons (desktop and mobile)
    document.getElementById('home-btn')?.addEventListener('click', () => {
      navigateTo('/');
    });
    document.getElementById('home-btn-mobile')?.addEventListener('click', () => {
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

    // Profile button (mobile)
    document.getElementById('profile-btn-mobile')?.addEventListener('click', () => {
      navigateTo('/profile');
    });

    // Logout button (desktop and mobile) - Use NavigationManager
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });
    document.getElementById('logout-btn-mobile')?.addEventListener('click', () => {
      this.handleLogout();
    });

    // Header action buttons
    document.getElementById('search-toggle-sidebar')?.addEventListener('click', () => {
      // Import and call setupAddUserModal dynamically to avoid circular dependencies
      import('../pages/ChatPage').then(({ setupAddUserModal }) => {
        setupAddUserModal();
      });
    });

    document.getElementById('notification-toggle-sidebar')?.addEventListener('click', () => {
      // Import and call setupSidebarNotificationEvents dynamically
      import('../pages/ChatPage').then(({ setupSidebarNotificationEvents }) => {
        setupSidebarNotificationEvents();
      });
    });
  }

  /**
   * Sets up shell enhancements (profile image, language switcher, etc.)
   */
  private setupShellEnhancements(): void {
    this.updateHeaderProfileImage();
    this.initializeLanguageSwitcher();
    this.setupNotificationBadge();
    this.createAddUserModal();
  }

  /**
   * Updates the header profile image
   */
  private updateHeaderProfileImage(): void {
    import('../utils/authState').then(({ getCurrentUser }) => {
      const currentUser = getCurrentUser();
      const headerProfileImage = document.getElementById('header-profile-image') as HTMLImageElement;
      
      if (headerProfileImage && currentUser) {
        let imageSrc = '/default-avatar.png';
        
        if (currentUser.picture && currentUser.picture !== '/default-avatar.png') {
          imageSrc = currentUser.picture;
        }
        
        headerProfileImage.src = imageSrc;
        headerProfileImage.onerror = () => {
          headerProfileImage.src = '/default-avatar.png';
        };
      }
    });
  }

  /**
   * Initializes the language switcher
   */
  private initializeLanguageSwitcher(): void {
    const languageSwitcherContainer = document.getElementById('language-switcher-container');
    if (languageSwitcherContainer) {
      import('../components/LanguageSwitcher').then(({ LanguageSwitcher }) => {
        import('./router').then(({ renderRoute }) => {
          new LanguageSwitcher(languageSwitcherContainer, {
            onLanguageChange: async (language) => {
              console.log(`Language changed to: ${language}`);
              const currentPath = window.location.pathname;
              await renderRoute(currentPath);
            }
          });
        });
      });
    }
  }

  /**
   * Sets up notification badge
   */
  private setupNotificationBadge(): void {
    const notButton = document.getElementById('notification-toggle-sidebar');
    if (notButton) {
      import('../pages/ChatPage').then(({ totalNotifications }) => {
        const badgeHTML = totalNotifications > 0 ? 
          `<span class="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-semibold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-md">${totalNotifications > 99 ? '99+' : totalNotifications}</span>` : 
          '';
        if (badgeHTML && !notButton.querySelector('span')) {
          notButton.insertAdjacentHTML('beforeend', badgeHTML);
        }
      });
    }
  }

  /**
   * Creates the add user modal if it doesn't exist
   */
  private createAddUserModal(): void {
    const existingModal = document.getElementById('add-user-modal');
    if (!existingModal) {
      const modalHTML = `
        <div id="add-user-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-in fade-in duration-300">
          <div class="relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-[90vw] sm:max-w-[480px] mx-4 max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-white/30 shadow-2xl transform transition-all duration-300 scale-95">
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
                <div class="relative flex items-center">
                  <div class="absolute left-4 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="7" stroke-width="1.8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="1.8" stroke-linecap="round"></line>
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    id="search-input" 
                    placeholder="Search by username or email..." 
                    class="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 text-gray-800 placeholder-gray-500"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>

            <!-- Enhanced Search Results -->
            <div id="search-results" class="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px]">
              <div class="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-full blur"></div>
                  <div class="relative bg-gradient-to-r from-orange-500/10 to-blue-500/10 p-4 rounded-full">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                </div>
                <p class="text-sm font-medium">${i18n.t('chat.startTypingToSearch')}</p>
                <p class="text-xs text-gray-400 text-center px-4">${i18n.t('chat.findFriendsByUsername')}</p>
              </div>
            </div>

            <!-- Enhanced Loading State -->
            <div id="search-loading" class="hidden flex-1 flex items-center justify-center min-h-[200px]">
              <div class="flex flex-col items-center space-y-4">
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full blur opacity-75 animate-pulse"></div>
                  <div class="relative bg-gradient-to-r from-orange-500 to-blue-500 p-3 rounded-full">
                    <svg class="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-sm font-medium text-gray-600">Searching for users...</p>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
  }
}

// Export singleton instance
export const navigationManager = NavigationManager.getInstance();