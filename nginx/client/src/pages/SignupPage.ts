import { api } from "@/services/api";
import { User } from "@/types/user";
import { isLoggedIn, saveTokens } from "@/utils/auth";
import { getCurrentUser, setCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { initGoogleSignIn, showToast } from "@/utils/utils";
import { i18n } from "@/services/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function renderSignup() {
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
        class="relative w-full min-h-screen bg-[url('https://c.animaapp.com/meotu59csaTQmy/img/1920-1080-2.png')] bg-cover bg-center flex flex-col items-center justify-start px-6 py-12 overflow-y-auto"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/30" aria-hidden="true"></div>
        
        <!-- Language Switcher in top-right corner -->
        <div class="absolute top-6 right-6 z-20">
          <div id="language-switcher-container"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 w-full max-w-3xl text-center space-y-6 my-4 sm:my-8">
          <!-- Beautiful Glass Container -->
            <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <!-- Gradient overlay for extra depth -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
            
            <!-- Inner glow effect -->
            <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
            
            <!-- Content inside container -->
            <div class="relative z-10 space-y-6">
              <!-- Title -->
              <header class="flex items-center justify-center gap-3">
                <h1 class="font-semibold text-white text-3xl md:text-4xl drop-shadow-lg">
                  ${i18n.t('auth.joinTheGame')}
                </h1>
                <img 
                  src="https://c.animaapp.com/meotu59csaTQmy/img/image-1.png"
                  alt="ft_pong logo"
                  class="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg"
                />
              </header>

              <!-- Quote -->
              <p class="italic text-white/90 text-sm md:text-base drop-shadow-md">
                "${i18n.t('auth.signupQuote')}"
              </p>

              <!-- Form -->
              <form id="signup-form" class="space-y-4 sm:space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="fullname" class="block text-sm font-medium text-white mb-1">${i18n.t('auth.fullName')}</label>
                    <input type="text" id="fullname" class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300" placeholder="${i18n.t('auth.enterFullName')}" required>
                    <p id="fullname-error" class="mt-1 text-sm text-red-300 hidden"></p>
                  </div>
                  <div>
                    <label for="nickname" class="block text-sm font-medium text-white mb-1">${i18n.t('auth.nickname')}</label>
                    <input type="text" id="nickname" class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300" placeholder="${i18n.t('auth.chooseNickname')}" required>
                    <p id="nickname-error" class="mt-1 text-sm text-red-300 hidden"></p>
                  </div>
                </div>
                <div class="relative">
                  <label for="picture" class="block text-sm font-medium text-white mb-1">${i18n.t('auth.profilePicture')}</label>
                  <div class="flex items-center gap-4">
                    <div id="preview-container" class="w-24 h-24 rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden shadow-md">
                      <img id="picture-preview" class="object-cover w-full h-full hidden" alt="Profile preview">
                      <img id="default-preview" src="/assets/default-avatar.svg" alt="Default avatar" class="w-full h-full object-cover opacity-70" />
                    </div>
                    <label for="picture" class="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30">
                      ${i18n.t('auth.uploadPicture')}
                    </label>
                  </div>
                  <input type="file" id="picture" accept="image/jpeg,image/png" class="hidden">
                  <p id="picture-error" class="mt-1 text-sm text-red-300 hidden"></p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="email" class="block text-sm font-medium text-white mb-1">${i18n.t('auth.email')}</label>
                    <input type="email" id="email" class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300" placeholder="${i18n.t('auth.enterEmail')}" required>
                    <p id="email-error" class="mt-1 text-sm text-red-300 hidden"></p>
                  </div>
                  <div>
                    <label for="password" class="block text-sm font-medium text-white mb-1">${i18n.t('auth.password')}</label>
                    <input type="password" id="password" class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300" placeholder="${i18n.t('auth.createPassword')}" required minlength="8">
                    <div id="password-strength" class="mt-1 text-sm hidden"></div>
                    <p id="password-error" class="mt-1 text-sm text-red-300 hidden"></p>
                  </div>
                </div>
                <div>
                  <label for="confirm-password" class="block text-sm font-medium text-white mb-1">${i18n.t('auth.confirmPassword')}</label>
                  <input type="password" id="confirm-password" class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-300" placeholder="${i18n.t('auth.confirmPasswordPlaceholder')}" required>
                  <p id="confirm-password-error" class="mt-1 text-sm text-red-300 hidden"></p>
                </div>
                <button 
                  type="submit" 
                  class="group relative w-full bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-orange-400/30 hover:border-orange-400/50 overflow-hidden backdrop-blur-sm font-semibold"
                >
                  <span class="relative z-10">${i18n.t('auth.signUp')}</span>
                  <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                </button>
              </form>

              <!-- Divider -->
              <div class="relative flex items-center justify-center">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-white/40"></div>
                </div>
                <div class="relative bg-white/10 backdrop-blur-sm px-4 rounded-full">
                  <span class="text-white/80 text-sm font-medium">${i18n.t('auth.or')}</span>
                </div>
              </div>

              <!-- Google Button -->
              <button 
                type="button"
                id="google-signin-btn"
                class="group relative w-full bg-white/90 hover:bg-white text-gray-700 rounded-2xl py-4 px-6 flex items-center justify-center gap-4 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 ease-out border border-white/30 hover:border-white/50 overflow-hidden backdrop-blur-sm"
              >
                <!-- Similar enhancements as in login page -->
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-red-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div class="absolute top-2 left-4 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <div class="absolute top-6 right-8 w-1 h-1 bg-red-400 rounded-full animate-pulse" style="animation-delay: 0.3s"></div>
                  <div class="absolute bottom-4 left-8 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.6s"></div>
                  <div class="absolute bottom-2 right-4 w-1 h-1 bg-green-400 rounded-full animate-pulse" style="animation-delay: 0.9s"></div>
                </div>
                <div class="relative z-10 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
                  <div class="relative">
                    <img 
                      src="https://c.animaapp.com/meotu59csaTQmy/img/google.png"
                      alt="Google logo"
                      class="w-8 h-8 md:w-9 md:h-9 drop-shadow-lg filter group-hover:brightness-110"
                    />
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
                  </div>
                </div>
                <span class="relative z-10 text-lg md:text-xl font-bold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-red-600 group-hover:to-yellow-600 transition-all duration-500">
                  ${i18n.t('auth.signUpWithGoogle')}
                </span>
                <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out skew-x-12"></div>
                <div class="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/20 via-red-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>

              <!-- Login Link -->
              <p class="text-white/90 text-sm md:text-base">
                ${i18n.t('auth.alreadyHaveAccount')}
                <a 
                  href="#" 
                  id="login"
                  class="font-semibold text-orange-300 hover:text-orange-200 transition-colors duration-200 hover:underline ml-1"
                >
                  ${i18n.t('auth.signIn')}
                </a>
              </p>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div id="loading-indicator" class="hidden mt-4 text-center relative z-10">
            <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div class="loader mx-auto border-4 border-white/30 border-t-white rounded-full w-8 h-8 animate-spin"></div>
              <p class="text-white/80 text-sm mt-2">${i18n.t('auth.creatingAccount')}</p>
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
        updateSignupPageText();
      }
    });
  }
  
  setupSignupEvents();
}

function updateSignupPageText() {
  // Update all translatable text elements without re-rendering
  const elements = {
    'h1': 'auth.createAccount',
    'p': 'auth.signupQuote',
    '#google-signin-btn span': 'auth.continueWithGoogle',
    '.text-white\/80.text-sm.font-medium': 'auth.or',
    'p.text-white\/90.text-sm': 'auth.alreadyHaveAccount',
    '#login': 'auth.signIn',
    '#loading-indicator p': 'auth.creatingAccount'
  };

  Object.entries(elements).forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element) {
      if (key === 'auth.alreadyHaveAccount') {
        // Special handling for the "Already have account" text
        element.innerHTML = `${i18n.t('auth.alreadyHaveAccount')}
        <a 
          href="#" 
          id="login"
          class="font-semibold text-orange-300 hover:text-orange-200 transition-colors duration-200 hover:underline ml-1"
        >
          ${i18n.t('auth.signIn')}
        </a>`;
      } else {
        element.textContent = i18n.t(key);
      }
    }
  });
}

function setupSignupEvents() {
  const form = document.getElementById('signup-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = (document.getElementById('fullname') as HTMLInputElement).value;
      const nickName = (document.getElementById('nickname') as HTMLInputElement).value;
      const pictureInput = document.getElementById('picture') as HTMLInputElement;
      let valid = true;
      let picture = '';
      if (pictureInput.files && pictureInput.files[0]) {
        const file = pictureInput.files[0];
        // Validate file type and size
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          document.getElementById('picture-error')!.textContent = i18n.t('auth.onlyJpegPngAllowed');
          document.getElementById('picture-error')!.classList.remove('hidden');
          valid = false;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          document.getElementById('picture-error')!.textContent = i18n.t('auth.fileSizeLimitExceeded');
          document.getElementById('picture-error')!.classList.remove('hidden');
          valid = false;
        }
        if (!valid) return;
        // Convert to base64
        picture = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

      // Client-side validation
      if (!fullName) {
        document.getElementById('fullname-error')!.textContent = i18n.t('auth.fullNameRequired');
        document.getElementById('fullname-error')!.classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('fullname-error')!.classList.add('hidden');
      }
      if (!nickName) {
        document.getElementById('nickname-error')!.textContent = i18n.t('auth.nicknameRequired');
        document.getElementById('nickname-error')!.classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('nickname-error')!.classList.add('hidden');
      }
      if (!email) {
        document.getElementById('email-error')!.textContent = i18n.t('auth.emailRequired');
        document.getElementById('email-error')!.classList.remove('hidden');
        valid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        document.getElementById('email-error')!.textContent = i18n.t('auth.emailInvalid');
        document.getElementById('email-error')!.classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('email-error')!.classList.add('hidden');
      }
      if (!password) {
        document.getElementById('password-error')!.textContent = i18n.t('auth.passwordRequired');
        document.getElementById('password-error')!.classList.remove('hidden');
        valid = false;
      } else {
        // Complexity check
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*]/.test(password);
        if (password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          document.getElementById('password-error')!.textContent = i18n.t('auth.passwordComplexityRequirement');
          document.getElementById('password-error')!.classList.remove('hidden');
          valid = false;
        } else {
          document.getElementById('password-error')!.classList.add('hidden');
        }
      }
      if (password !== confirmPassword) {
        document.getElementById('confirm-password-error')!.textContent = i18n.t('auth.passwordsDoNotMatch');
        document.getElementById('confirm-password-error')!.classList.remove('hidden');
        valid = false;
      } else {
        document.getElementById('confirm-password-error')!.classList.add('hidden');
      }
      document.getElementById('picture-error')!.classList.add('hidden'); // Hide error if valid

      if (!valid) return;

      const user: User = {
        fullName,
        nickName,
        email,
        password,
        picture
      }
      await signupMutation(user);
    });

    document.getElementById('login')!.addEventListener('click', () => {
      navigateTo('/login');
    });

    
    // Image preview with improvements
    const pictureInput = document.getElementById('picture') as HTMLInputElement;
    const defaultPreview = document.getElementById('default-preview') as HTMLElement | null;
    pictureInput.addEventListener('change', () => {
      const file = pictureInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = document.getElementById('picture-preview') as HTMLImageElement;
          preview.src = e.target?.result as string;
          preview.classList.remove('hidden');
          if (defaultPreview) defaultPreview.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    // Password strength indicator
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    passwordInput.addEventListener('input', () => {
      const strength = calculatePasswordStrength(passwordInput.value);
      const strengthEl = document.getElementById('password-strength')!;
      strengthEl.classList.remove('hidden');
      strengthEl.textContent = `${i18n.t('auth.passwordStrength')}: ${i18n.t(`auth.strength${strength}`)}`;
      strengthEl.className = `mt-1 text-sm ${strength === 'Strong' ? 'text-green-300' : strength === 'Medium' ? 'text-yellow-300' : 'text-red-300'}`;
    });
  }

  function calculatePasswordStrength(password: string): string {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    if (strength >= 5) return 'Strong';
    if (strength >= 3) return 'Medium';
    return 'Weak';
  }

  async function signupMutation(user: User): Promise<void> {
    const formContainer = document.getElementById('signup-form')?.parentElement;
    const loader = (formContainer?.querySelector('#loading-indicator') as HTMLElement) || document.getElementById('loading-indicator');
    const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (loader) loader.classList.remove('hidden');
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await api.signup(user);
      if (response.success) {
        showToast(i18n.t('auth.signupSuccessful'), "success");
        navigateTo('/login');
      }
      else
        showToast(`${i18n.t('auth.signupFailed')}: ${response.message}`, "error");


    } catch (error) {
      showToast(`${i18n.t('auth.signupFailed')}: ${error}`, "error");
      console.error('Signup error:', error);
    } finally {
      if (loader) loader.classList.add('hidden');
      if (submitButton) submitButton.disabled = false;
    }
  }





  initGoogleSignIn();

}
