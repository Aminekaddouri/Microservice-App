import { api } from "@/services/api";
import { logout, setEmailVerificationChecked, invalidateVerificationCache, setCachedVerificationStatus } from "@/utils/auth";
import { getCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { loadingIndicator, showToast } from "@/utils/utils";
import { checkEmailVerification } from "./LoginPage";
import { i18n } from "@/services/i18n";
import { navigationManager } from "../utils/NavigationManager";

export async function renderCheckYourEmailPage() {
  const app = document.getElementById("app");
  if (!app) return;

  // Check for verification token in URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const id = params.get('id');

  if (token && id) {
    app.innerHTML = loadingIndicator;
    try {
      const response = await api.verifyEmail(token, id);
      if (response.success) {
        showToast(i18n.t('auth.emailVerifiedSuccessfully'), 'success');
        // Cache the verified status and invalidate old cache
        invalidateVerificationCache();
        setCachedVerificationStatus(id, true);
        setEmailVerificationChecked(false);
        if (location.pathname !== '/') {
          navigateTo('/');
        }
        return;
      } else {
        showToast(`${i18n.t('auth.verificationFailed')}: ${response.message || i18n.t('common.unknownError')}`, 'error');
      }
    } catch (error) {
      showToast(`${i18n.t('auth.verificationError')}: ${error instanceof Error ? error.message : i18n.t('common.unknownError')}`, 'error');
    }
  }

  app.innerHTML = loadingIndicator;
  const isVerified = await checkEmailVerification(getCurrentUser()!.id!);
  if (isVerified) {
    // Reset the verification check flag since email is now verified
    setEmailVerificationChecked(false);
    if (location.pathname !== '/') {
      navigateTo('/');
    }
    return;
  }
  app.innerHTML = `
    <main class="w-full min-h-screen flex items-center justify-center">
      <section 
        class="relative w-full min-h-screen bg-[url('https://c.animaapp.com/meotu59csaTQmy/img/1920-1080-2.png')] bg-cover bg-center flex flex-col items-center justify-center px-6"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/30" aria-hidden="true"></div>

        <!-- Content -->
        <div class="relative z-10 w-full max-w-md text-center space-y-6">
          <!-- Beautiful Glass Container -->
          <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <!-- Gradient overlay for extra depth -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
            
            <!-- Inner glow effect -->
            <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
            
            <!-- Content inside container -->
            <div class="relative z-10 space-y-6">
              <!-- Title -->
              <header class="flex items-center justify-center gap-3">
                <h1 class="font-semibold text-white text-3xl md:text-4xl drop-shadow-lg">
                  ${i18n.t('auth.checkYourEmail')}
                </h1>
                <img 
                  src="https://c.animaapp.com/meotu59csaTQmy/img/image-1.png"
                  alt="ft_pong logo"
                  class="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg"
                />
              </header>

              <!-- Message -->
              <p class="text-white/90 text-base drop-shadow-md">
                ${i18n.t('auth.verificationLinkSent')} <strong>${getCurrentUser()?.email}</strong>. ${i18n.t('auth.checkInboxAndClick')}
              </p>
              <p class="text-white/80 text-sm">${i18n.t('auth.didntGetEmail')}</p>

              <!-- Buttons -->
              <div class="space-y-4">
                <button 
                  id="resend-btn"
                  class="group relative w-full bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-blue-400/30 hover:border-blue-400/50 overflow-hidden backdrop-blur-sm font-semibold"
                >
                  <span class="relative z-10">${i18n.t('auth.resendEmail')}</span>
                  <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                </button>
                <button 
                  id="logout-btn"
                  class="group relative w-full bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white rounded-2xl py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-red-400/30 hover:border-red-400/50 overflow-hidden backdrop-blur-sm font-semibold"
                >
                  <span class="relative z-10">${i18n.t('nav.logout')}</span>
                  <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          -  <div id="loading-indicator" class="hidden mt-4 text-center">
          +  <div id="loading-indicator" class="hidden mt-4 text-center relative z-10">
               <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
                 <div class="loader mx-auto border-4 border-white/30 border-t-white rounded-full w-8 h-8 animate-spin"></div>
                 <p class="text-white/80 text-sm mt-2">${i18n.t('auth.resendingVerification')}</p>
               </div>
             </div>
        </div>
      </section>
    </main>
  `;

  const loader = document.getElementById('loading-indicator');
  const resendBtn = document.getElementById("resend-btn") as HTMLButtonElement | null;;
  const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement | null;;

  resendBtn?.addEventListener("click", async () => {
    const li = document.querySelector('#loading-indicator:last-of-type') as HTMLElement || document.getElementById('loading-indicator');
    if (li) li.classList.remove('hidden');
    if (resendBtn) resendBtn.disabled = true;
    if (logoutBtn) logoutBtn.disabled = true;
    try {
      const res = await api.resendVerificationEmail(getCurrentUser()!.id!);
      if (res.success) {
        showToast(i18n.t('auth.verificationEmailResentSuccessfully'), "success");
      } else {
        showToast(i18n.t('auth.failedToResendVerificationEmail'), "error");
      }
    } catch (err) {
      console.error("Resend error:", err);
      showToast(i18n.t('auth.errorResendingVerificationEmail'), "error");
    } finally {
      if (li) li.classList.add('hidden');
      if (resendBtn) resendBtn.disabled = false;
      if (logoutBtn) logoutBtn.disabled = false;
    }
  });
  logoutBtn?.addEventListener("click", () => {
    navigationManager.handleLogout();
  });

  // Add polling to check email verification with backoff and max attempts
  let attempts = 0;
  const maxAttempts = 20; // Limit attempts
  let intervalTime = 15000; // Start with 15 seconds
  let pollingInterval: NodeJS.Timeout | null = null;
  let isPolling = false; // Prevent concurrent calls

  const pollVerification = async () => {
    if (isPolling) return; // Prevent concurrent calls
    
    attempts++;
    if (attempts > maxAttempts) {
      if (pollingInterval) clearInterval(pollingInterval as any);
      showToast(i18n.t('auth.verificationCheckTimedOut'), 'error');
      return;
    }

    isPolling = true;
    try {
      // Use force refresh every 3rd attempt to bypass cache occasionally
      const forceRefresh = attempts % 3 === 0;
      const isVerified = await checkEmailVerification(getCurrentUser()!.id!, forceRefresh);
      if (isVerified) {
        if (pollingInterval) clearInterval(pollingInterval as any);
        setEmailVerificationChecked(false);
        if (location.pathname !== '/') {
          navigateTo('/');
        }
        return;
      }
      // Reset interval time on success
      intervalTime = 15000;
    } catch (error) {
      console.error('Polling error:', error);
      // Exponential backoff on error
      intervalTime = Math.min(intervalTime * 1.5, 45000); // Up to 45 seconds
    } finally {
      isPolling = false;
    }

    // Schedule next poll
    if (pollingInterval) clearInterval(pollingInterval as any);
    pollingInterval = setTimeout(pollVerification, intervalTime) as unknown as NodeJS.Timeout;
  };

  // Start initial poll after 15 seconds
  pollingInterval = setTimeout(pollVerification, intervalTime) as unknown as NodeJS.Timeout;

  // Cleanup interval on navigation could be added if you have a global route change hook
}