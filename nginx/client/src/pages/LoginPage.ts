import { api } from "@/services/api";
import { LoginCredentials } from "@/types/auth";
import { isLoggedIn, saveTokens, getCachedVerificationStatus, setCachedVerificationStatus, invalidateVerificationCache } from "@/utils/auth";
import { getCurrentUser, setCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { initGoogleSignIn, loadingIndicator, showToast } from "@/utils/utils";
import { i18n } from "@/services/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function renderLogin() {
  if (isLoggedIn()) {
    navigateTo('/dashboard');
    return;
  }

  // Wait for translations to load before rendering
  await i18n.waitForTranslations();
  
  // Add auth-page class to body for scrolling
  document.body.classList.add('auth-page');

  document.getElementById('app')!.innerHTML = `
    <main class="w-full min-h-screen overflow-y-auto">
      <section 
        class="relative w-full min-h-screen bg-[url('https://c.animaapp.com/meotu59csaTQmy/img/1920-1080-2.png')] bg-cover bg-center flex flex-col items-center justify-center px-3 sm:px-6 py-8 sm:py-12"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/30" aria-hidden="true"></div>
        
        <!-- Language Switcher in top-right corner -->
        <div class="absolute top-6 right-6 z-20">
          <div id="language-switcher-container"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 w-full max-w-md text-center space-y-4 sm:space-y-6">
          <!-- Beautiful Glass Container -->
          <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <!-- Gradient overlay for extra depth -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
            
            <!-- Inner glow effect -->
            <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
            
            <!-- Content inside container -->
            <div class="relative z-10 space-y-3 sm:space-y-4 md:space-y-6">
              <!-- Title -->
              <header class="flex items-center justify-center gap-3">
                <h1 class="font-semibold text-white text-3xl md:text-4xl drop-shadow-lg">
                  ${i18n.t('auth.welcomeBack')}
                </h1>
                <img 
                  src="https://c.animaapp.com/meotu59csaTQmy/img/image-1.png"
                  alt="ft_pong logo"
                  class="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg"
                />
              </header>

              <!-- Quote -->
              <p class="italic text-white/90 text-sm md:text-base drop-shadow-md">
                "${i18n.t('auth.loginQuote')}"
              </p>

              <!-- Enhanced Google Button -->
              <div class="space-y-4">
                <button 
                  type="button"
                  id="google-signin-btn"
                  class="group relative w-full bg-white/90 hover:bg-white text-gray-700 rounded-2xl py-4 px-6 flex items-center justify-center gap-4 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 ease-out border border-white/30 hover:border-white/50 overflow-hidden backdrop-blur-sm"
                >
                  <!-- Animated gradient background -->
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-red-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <!-- Floating particles effect -->
                  <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div class="absolute top-2 left-4 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                    <div class="absolute top-6 right-8 w-1 h-1 bg-red-400 rounded-full animate-pulse" style="animation-delay: 0.3s"></div>
                    <div class="absolute bottom-4 left-8 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.6s"></div>
                    <div class="absolute bottom-2 right-4 w-1 h-1 bg-green-400 rounded-full animate-pulse" style="animation-delay: 0.9s"></div>
                  </div>
                  
                  <!-- Google logo with enhanced styling -->
                  <div class="relative z-10 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
                    <div class="relative">
                      <img 
                        src="https://c.animaapp.com/meotu59csaTQmy/img/google.png"
                        alt="Google logo"
                        class="w-8 h-8 md:w-9 md:h-9 drop-shadow-lg filter group-hover:brightness-110"
                      />
                      <!-- Glow effect -->
                      <div class="absolute inset-0 bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
                    </div>
                  </div>
                  
                  <!-- Enhanced text with gradient -->
                  <span class="relative z-10 text-lg md:text-xl font-bold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-red-600 group-hover:to-yellow-600 transition-all duration-500">
                    ${i18n.t('auth.continueWithGoogle')}
                  </span>
                  
                  <!-- Premium shine effect -->
                  <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out skew-x-12"></div>
                  
                  <!-- Border glow -->
                  <div class="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/20 via-red-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>

                <!-- Divider -->
                <div class="relative flex items-center justify-center">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-white/40"></div>
                  </div>
                  <div class="relative bg-white/10 backdrop-blur-sm px-4 rounded-full">
                    <span class="text-white/80 text-sm font-medium">${i18n.t('auth.or')}</span>
                  </div>
                </div>

                <!-- Enhanced Email Button -->
                <button 
                  type="button"
                  id="email-signin"
                  class="group relative w-full bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 ease-out border border-orange-400/30 hover:border-orange-400/50 overflow-hidden backdrop-blur-sm"
                >
                  <!-- Animated background -->
                  <div class="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <!-- Email icon -->
                  <div class="relative z-10">
                    <svg class="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                  </div>
                  
                  <span class="relative z-10 text-lg md:text-xl font-semibold">
                    ${i18n.t('auth.continueWithEmail')}
                  </span>
                  
                  <!-- Shine effect -->
                  <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                </button>
              </div>

              <!-- Sign up Link -->
              <p class="text-white/90 text-sm md:text-base">
                ${i18n.t('auth.dontHaveAccount')}
                <a 
                  href="#" 
                  id="signup-link"
                  class="font-semibold text-orange-300 hover:text-orange-200 transition-colors duration-200 hover:underline ml-1"
                >
                  ${i18n.t('auth.signup')}
                </a>
              </p>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div id="loading-indicator" class="hidden mt-4 text-center relative z-10">
            <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div class="loader mx-auto border-4 border-white/30 border-t-white rounded-full w-8 h-8 animate-spin"></div>
              <p class="text-white/80 text-sm mt-2">${i18n.t('auth.signingIn')}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
  
  // Initialize language switcher for public pages
  const languageSwitcherContainer = document.getElementById('language-switcher-container');
  if (languageSwitcherContainer) {
    new LanguageSwitcher(languageSwitcherContainer, {
      onLanguageChange: (language) => {
        // Update text content without re-rendering the entire page
        updateLoginPageText();
      }
    });
  }
  setupLoginEvents();
}

function updateLoginPageText() {
  // Update all translatable text elements without re-rendering
  const elements = {
    'h1': 'auth.welcomeBack',
    'p': 'auth.loginQuote',
    '#google-signin-btn span': 'auth.continueWithGoogle',
    '.text-white\/80.text-sm.font-medium': 'auth.or',
    '#email-signin span': 'auth.continueWithEmail',
    'p.text-white\/90.text-sm': 'auth.dontHaveAccount',
    '#signup-link': 'auth.signup',
    '#loading-indicator p': 'auth.signingIn'
  };

  Object.entries(elements).forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element) {
      if (key === 'auth.dontHaveAccount') {
        // Special handling for the "Don't have account" text
        element.innerHTML = `${i18n.t('auth.dontHaveAccount')}
        <a 
          href="#" 
          id="signup-link"
          class="font-semibold text-orange-300 hover:text-orange-200 transition-colors duration-200 hover:underline ml-1"
        >
          ${i18n.t('auth.signup')}
        </a>`;
      } else {
        element.textContent = i18n.t(key);
      }
    }
  });
}

export function setupLoginEvents() {
  // One-time listener to show 2FA form when Google login returns pending2fa
  if (!(window as any).__twoFAListenerAdded) {
    document.addEventListener('show-2fa-form', (e: any) => {
      const token = e?.detail?.tempToken;
      if (token) {
        show2FAVerificationForm(token);
      } else {
        showToast(i18n.t('auth.missing2FAToken'), 'error');
      }
    });
    (window as any).__twoFAListenerAdded = true;
  }

  // Google Sign In
  initGoogleSignIn();

  // Email Sign In - implement traditional login form
  document.getElementById('email-signin')?.addEventListener('click', () => {
    // Show traditional email/password form
    showEmailLoginForm();
  });

  // Sign up link
  document.getElementById('signup-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/signup');
  });
}

function showEmailLoginForm() {
  const content = document.querySelector('.relative.z-10');
  if (content) {
    content.innerHTML = `
      <!-- Beautiful Glass Container for Form -->
      <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-w-md w-full mx-4 sm:mx-0">
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
        
        <!-- Inner glow -->
        <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
        
        <!-- Content -->
        <div class="relative z-10 space-y-4 sm:space-y-6">
          <!-- Back Button -->
          <button id="back-btn" class="text-white/80 hover:text-white transition flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            ${i18n.t('auth.backToOptions')}
          </button>
          
          <!-- Title -->
          <header class="text-center">
            <h1 class="font-semibold text-white text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">
              ${i18n.t('auth.signInWithEmail')}
            </h1>
            <p class="italic text-white/80 text-sm mt-2">${i18n.t('auth.enterCredentials')}</p>
          </header>

         <!-- Login Form -->
              <form id="login-form" class="space-y-3 sm:space-y-4 md:space-y-6">
            <div>
              <input 
                type="email" 
                id="email" 
                placeholder="${i18n.t('auth.email')}"
                class="w-full px-4 py-4 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                required
              >
            </div>
            <div>
              <input 
                type="password" 
                id="password" 
                placeholder="${i18n.t('auth.password')}"
                class="w-full px-4 py-4 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                required
                minlength="8"
              >
            </div>
            <button 
              type="submit" 
              class="group relative w-full bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl py-4 sm:py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-orange-400/30 hover:border-orange-400/50 overflow-hidden backdrop-blur-sm font-semibold text-base sm:text-sm"
            >
              <span class="relative z-10">${i18n.t('auth.signIn')}</span>
              <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
            </button>
          </form>

          <!-- Loading Indicator -->
          <div id="loading-indicator" class="hidden mt-4 text-center relative z-10">
            <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div class="loader mx-auto border-4 border-white/30 border-t-white rounded-full w-8 h-8 animate-spin"></div>
              <p class="text-white/80 text-sm mt-2">${i18n.t('auth.signingIn')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Setup form events with validation
    setupEmailLoginEvents();
  }
}

function setupEmailLoginEvents() {
  const form = document.getElementById('login-form') as HTMLFormElement;
  const backBtn = document.getElementById('back-btn');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      // Client-side validation
      if (!email || !password) {
        showToast(i18n.t('auth.fillAllFields'), 'error');
        return;
      }
      if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        showToast(i18n.t('auth.enterValidEmail'), 'error');
        return;
      }
      if (password.length < 8) {
        showToast(i18n.t('auth.passwordMinLength'), 'error');
        return;
      }
      
      await loginMutation({ email, password });
    });
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      renderLogin(); // Go back to main login
    });
  }
}



async function loginMutation(credentials: LoginCredentials): Promise<void> {
  const formEl = document.getElementById('login-form');
  const loader = (formEl?.parentElement?.querySelector('#loading-indicator') as HTMLElement) || document.getElementById('loading-indicator');
  const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
  
  if (loader) loader.classList.remove('hidden');
  if (submitButton) submitButton.disabled = true;
  
  try {
    let response = await api.login(credentials);
    console.log(response);
    
    // Handle 2FA pending flow
    if (response?.success && response.pending2fa && response.tempToken) {
      showToast(i18n.t('auth.twoFactorRequired'), 'success');
      show2FAVerificationForm(response.tempToken);
      return; // Stop normal flow; 2FA continues separately
    }

    if (response && response.accessToken && response.success && response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
      setCurrentUser(response.user);
      saveTokens(response.accessToken);
      console.log('Login successful!');
      showToast(i18n.t('auth.loginSuccessful'), "success");
      checkEmailVerification(response.user.id!);
    } else {
      showToast(`${i18n.t('auth.loginError')}: ${response?.message ?? i18n.t('auth.unknownError')}`, "error");
    }
  } catch (error) {
    const msg = (error as any)?.message ?? String(error);
    showToast(`${i18n.t('auth.loginError')}: ${msg}`, "error");
    console.error('Login error:', error);
  } finally {
    if (loader) loader.classList.add('hidden');
    if (submitButton) submitButton.disabled = false;
  }
}

export async function checkEmailVerification(userId: string, forceRefresh: boolean = false): Promise<boolean> {
  try {
    // Fast-path: Google accounts are auto-verified
    const current = getCurrentUser?.();
    if (current?.isGoogleUser) {
      setCachedVerificationStatus(userId, true);
      if (location.pathname !== '/dashboard') {
        navigateTo('/dashboard');
      }
      return true;
    }

    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = getCachedVerificationStatus(userId);
      if (cached) {
        console.log('Using cached verification status:', cached.verified);
        if (cached.verified) {
          if (location.pathname !== '/dashboard') {
            navigateTo('/dashboard');
          }
          return true;
        } else {
          if (location.pathname !== '/check-your-email') {
            navigateTo('/check-your-email');
          }
          return false;
        }
      }
    }

    // Make API call if no valid cache or force refresh
    console.log('Making API call to check email verification');
    const response = await api.isEmailVerified(userId);
    
    if (response.success) {
      // Cache the result
      const isVerified = response.verified === true;
      setCachedVerificationStatus(userId, isVerified);
      
      if (isVerified) {
        // If verification status changed to verified, invalidate old cache
        const oldCached = getCachedVerificationStatus(userId);
        if (oldCached && !oldCached.verified) {
          invalidateVerificationCache();
        }
        if (location.pathname !== '/dashboard') {
          navigateTo('/dashboard');
        }
        return true;
      } else {
        if (location.pathname !== '/check-your-email') {
          navigateTo('/check-your-email');
        }
        return false;
      }
    } else {
      // Don't cache failed responses
      if (location.pathname !== '/check-your-email') {
        navigateTo('/check-your-email');
      }
      return false;
    }
  } catch (error) {
    console.error('Email verification check failed:', error);
    showToast(i18n.t('auth.failedEmailVerification'), 'error');
    return false;
  }
}



function show2FAVerificationForm(tempToken: string) {
  const content = document.querySelector('.relative.z-10');
  if (content) {
    content.innerHTML = `
      <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-w-md w-full mx-4 sm:mx-0">
        <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
        <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
        <div class="relative z-10 space-y-4 sm:space-y-6">
          <header class="text-center">
            <h1 class="font-semibold text-white text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">
              ${i18n.t('auth.twoFactorAuth')}
            </h1>
            <p class="italic text-white/80 text-sm mt-2">${i18n.t('auth.enterAuthCode')}</p>
          </header>

          <form id="2fa-form" class="space-y-4">
            <div>
              <input 
                type="text" 
                id="2fa-code" 
                placeholder="${i18n.t('auth.enterSixDigitCode')}"
                class="w-full px-4 py-4 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                required
                maxlength="6"
              >
            </div>
            <button 
              type="submit" 
              class="group relative w-full bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl py-4 sm:py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-orange-400/30 hover:border-orange-400/50 overflow-hidden backdrop-blur-sm font-semibold text-base sm:text-sm"
            >
              <span class="relative z-10">${i18n.t('auth.verify')}</span>
              <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
            </button>
          </form>

          <div id="loading-indicator" class="hidden mt-4 text-center">
            <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div class="loader mx-auto border-4 border-white/30 border-t-white rounded-full w-8 h-8 animate-spin"></div>
              <p class="text-white/80 text-sm mt-2">${i18n.t('auth.verifying')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const form = document.getElementById('2fa-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = (document.getElementById('2fa-code') as HTMLInputElement).value;
      if (code.length !== 6) {
        showToast(i18n.t('auth.enterSixDigitCode'), 'error');
        return;
      }
      await verify2FALogin(tempToken, code);
    });
  }
}

async function verify2FALogin(tempToken: string, code: string) {
  const formEl = document.getElementById('2fa-form');
  const loader = (formEl?.parentElement?.querySelector('#loading-indicator') as HTMLElement) || document.getElementById('loading-indicator');
  if (loader) loader.classList.remove('hidden');
  
  try {
    const response = await api.verify2FALogin(tempToken, code);
    
    if (response && response.accessToken && response.success && response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
      setCurrentUser(response.user);
      saveTokens(response.accessToken);
      console.log('2FA verification successful!');
      showToast(i18n.t('auth.loginSuccessful'), "success");
      checkEmailVerification(response.user.id!);
    } else {
      showToast(`${i18n.t('auth.verificationError')}: ${response?.message ?? i18n.t('auth.unknownError')}`, "error");
    }
  } catch (error) {
    const msg = (error as any)?.message ?? String(error);
    showToast(`${i18n.t('auth.verificationError')}: ${msg}`, "error");
    console.error('2FA verification error:', error);
  } finally {
    if (loader) loader.classList.add('hidden');
  }
}


