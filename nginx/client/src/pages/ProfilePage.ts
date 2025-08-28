import { api } from "@/services/api";
import { User } from "@/types/user";
import { isLoggedIn, getAccessToken, logout } from "@/utils/auth";
import { getCurrentUser, setCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { showToast, requestGoogleIdToken } from "@/utils/utils";
import { i18n } from "@/services/i18n";
import { showThemeEditor } from "@/components/ThemeEditor";
import { navigationManager } from "@/utils/NavigationManager";

export function renderProfile() {
  if (!isLoggedIn()) {
    navigateTo('/login');
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    navigateTo('/login');
    return;
  }

  document.getElementById('app')!.innerHTML = `
    <main class="w-full min-h-screen overflow-y-auto">
      <section 
        class="relative w-full min-h-screen bg-transparent flex flex-col items-center justify-start py-4 px-3 sm:px-4 md:px-6"
      >

        <!-- Content -->
        <div class="relative z-10 w-full max-w-6xl">
          <!-- Container -->
            
            <!-- Content inside container -->
            <div class="relative z-10 space-y-6 sm:space-y-8">
              <!-- Header -->
              <header class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row items-center gap-3">
                  <h1 class="font-semibold text-white text-2xl sm:text-3xl md:text-4xl drop-shadow-lg text-center sm:text-left">
                    ${i18n.t('profile.profileSettings')}
                  </h1>
                  <img 
                    src="https://c.animaapp.com/meotu59csaTQmy/img/image-1.png"
                    alt="ft_pong logo"
                    class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 drop-shadow-lg"
                  />
                </div>
              
              </header>

              <!-- Profile Sections -->
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
              <!-- Personal Information Section -->
                <div class="space-y-4 sm:space-y-6">
                  <h2 class="text-lg sm:text-xl font-semibold text-white text-center sm:text-left">${i18n.t('profile.personalInformation')}</h2>
                  
                  ${currentUser.isGoogleUser ? `
                    <div class="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.545 10.253v3.261h5.084c-.186 1.626-1.555 2.927-3.429 2.927-2.073 0-3.754-1.681-3.754-3.754 0-2.073 1.681-3.754 3.754-3.754 1.137 0 2.174.426 2.968 1.126l2.104-2.104c-1.281-1.206-2.959-1.953-5.072-1.953-3.144 0-5.696 2.552-5.696 5.696s2.552 5.696 5.696 5.696c3.31 0 5.515-2.324 5.515-5.616 0-.567-.058-1.123-.172-1.629H12.545z"/>
                      </svg>
                      <span class="text-blue-200 text-sm sm:text-base">${i18n.t('profile.googleAccountNote')}</span>
                    </div>
                  ` : ''}
                  <!-- Profile Picture -->
                  <div class="text-center sm:text-left">
                    <label class="block text-sm font-medium text-white mb-3">${i18n.t('profile.profilePicture')}</label>
                    <div class="flex flex-col sm:flex-row items-center gap-4">
                      <div class="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden shadow-md">
                        <img 
                          id="current-picture" 
                          src="${currentUser.picture || '/assets/default-avatar.svg'}" 
                          alt="Profile" 
                          class="object-cover w-full h-full"
                        >
                        <span id="picture-placeholder" class="hidden"></span>
                      </div>
                      <div class="space-y-2 w-full sm:w-auto">
                        <label 
                          for="picture-upload" 
                          class="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-3 sm:py-2 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30 text-sm w-full sm:w-auto inline-block text-center ${currentUser.isGoogleUser ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}"
                        >
                          ${i18n.t('profile.changePicture')}
                        </label>
                        <input type="file" id="picture-upload" accept="image/jpeg,image/png" class="hidden" ${currentUser.isGoogleUser ? 'disabled' : ''}>
                        ${currentUser.isGoogleUser ? `<p class="text-xs text-orange-300 text-center sm:text-left">${i18n.t('profile.googlePictureSync')}</p>` : ''}
                      </div>
                    </div>
                  </div>

                  <!-- Personal Info Form -->
                  <form id="profile-form" class="space-y-4">
                    <div>
                      <label for="fullName" class="block text-sm font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.fullName')}</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        value="${currentUser.fullName || ''}"
                        ${currentUser.isGoogleUser ? 'readonly' : ''}
                        class="w-full px-4 py-3 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left ${currentUser.isGoogleUser ? 'opacity-60 cursor-not-allowed' : ''}"
                        placeholder="${i18n.t('profile.enterFullName')}"
                      >
                      ${currentUser.isGoogleUser ? `<p class="text-xs text-orange-300 mt-1 text-center sm:text-left">${i18n.t('profile.googleNameSync')}</p>` : ''}
                    </div>
                    
                    <div>
                      <label for="nickname" class="block text-sm font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.nickname')}</label>
                      <input 
                        type="text" 
                        id="nickname" 
                        value="${currentUser.nickName || ''}"
                        class="w-full px-4 py-3 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                        placeholder="${i18n.t('profile.enterNickname')}"
                        required
                      >
                    </div>
                    
                    <div>
                      <label for="email" class="block text-sm font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.email')}</label>
                      <input 
                        type="email" 
                        id="email" 
                        value="${currentUser.email || ''}"
                        readonly
                        class="w-full px-4 py-3 sm:py-3 rounded-xl bg-white/5 border border-white/20 text-white/60 cursor-not-allowed text-center sm:text-left"
                      >
                      <p class="text-xs text-white/60 mt-1 text-center sm:text-left">${i18n.t('profile.emailCannotChange')}</p>
                    </div>

                    <button 
                      type="submit" 
                      class="group relative overflow-hidden w-full bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl py-4 sm:py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-blue-400/30 text-base sm:text-sm font-medium"
                    >
                      <span class="relative z-10">${i18n.t('profile.updateProfile')}</span>
                      <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                    </button>
                  </form>

                  <!-- Google Sync Button (for Google users) -->
                  ${currentUser.isGoogleUser ? `
                    <button 
                      id="sync-google-btn"
                      class="group relative overflow-hidden w-full bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-500 hover:to-green-600 text-white rounded-2xl py-4 sm:py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-green-400/30 text-base sm:text-sm font-medium"
                    >
                      <span class="relative z-10 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        ${i18n.t('profile.syncFromGoogle')}
                      </span>
                      <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                    </button>
                  ` : ''}

                  <!-- Game Theme Customization -->
                  <div class="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6">
                    <div class="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                      <div class="text-center sm:text-left">
                        <h3 class="text-base sm:text-lg font-medium text-white">${i18n.t('game.customizeGameAppearance')}</h3>
                        <p class="text-white/70 text-sm">${i18n.t('game.personalizeGame')}</p>
                      </div>
                      <div class="text-purple-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div class="space-y-4">
                      <div class="bg-white/5 rounded-xl p-3 sm:p-4">
                        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div class="text-center sm:text-left">
                            <p class="text-white font-medium text-sm sm:text-base">${i18n.t('game.currentTheme')}</p>
                            <p class="text-white/70 text-xs sm:text-sm">${i18n.t('game.customColorsForGame')}</p>
                          </div>
                          <div class="flex gap-2">
                            <div class="w-4 h-4 rounded-full bg-gray-800 border border-white/20" title="Board"></div>
                            <div class="w-4 h-4 rounded-full bg-orange-400 border border-white/20" title="Paddles"></div>
                            <div class="w-4 h-4 rounded-full bg-orange-300 border border-white/20" title="Ball"></div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        id="modify-theme-btn"
                        class="group relative overflow-hidden w-full bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-2xl py-4 sm:py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-yellow-400/30 text-base sm:text-sm font-medium"
                      >
                        <span class="relative z-10 flex items-center gap-2">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          ${i18n.t('game.modifyGameTheme')}
                        </span>
                        <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Security Section -->
                <div class="space-y-4 sm:space-y-6">
                  <h2 class="text-lg sm:text-xl font-semibold text-white text-center sm:text-left">${i18n.t('profile.securitySettings')}</h2>
                  
                  <!-- Password Change -->
                  ${!currentUser.isGoogleUser ? `
                    <div class="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6">
                      <h3 class="text-base sm:text-lg font-medium text-white mb-4 text-center sm:text-left">${i18n.t('profile.changePassword')}</h3>
                      <form id="password-form" class="space-y-4">
                        <div>
                          <label for="currentPassword" class="block text-sm font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.currentPassword')}</label>
                          <input 
                            type="password" 
                            id="currentPassword" 
                            class="w-full px-4 py-3 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                            placeholder="${i18n.t('profile.enterCurrentPassword')}"
                            required
                          >
                        </div>
                        
                        <div>
                          <label for="newPassword" class="block text-sm font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.newPassword')}</label>
                          <input 
                            type="password" 
                            id="newPassword" 
                            class="w-full px-4 py-3 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                            placeholder="${i18n.t('profile.enterNewPassword')}"
                            required
                            minlength="8"
                          >
                          <div id="password-strength" class="mt-1 text-sm hidden text-center sm:text-left"></div>
                        </div>
                        
                        <div>
                          <label for="confirmPassword" class="block text-sm font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.confirmPassword')}</label>
                          <input 
                            type="password" 
                            id="confirmPassword" 
                            class="w-full px-4 py-3 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-center sm:text-left"
                            placeholder="${i18n.t('profile.confirmNewPassword')}"
                            required
                          >
                        </div>

                        <button 
                          type="submit" 
                          class="group relative overflow-hidden w-full bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl py-4 sm:py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-orange-400/30 text-base sm:text-sm font-medium"
                        >
                          <span class="relative z-10">${i18n.t('profile.changePassword')}</span>
                          <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                        </button>
                      </form>
                    </div>
                  ` : `
                    <div class="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6">
                      <h3 class="text-base sm:text-lg font-medium text-white mb-2 text-center sm:text-left">${i18n.t('profile.password')}</h3>
                      <p class="text-white/70 text-sm text-center sm:text-left">${i18n.t('profile.googlePasswordNote')}</p>
                    </div>
                  `}

                  <!-- Two-Factor Authentication -->
                  <div class="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                      <div class="text-center sm:text-left">
                        <h3 class="text-base sm:text-lg font-medium text-white">${i18n.t('profile.twoFactorAuth')}</h3>
                        <p class="text-white/70 text-sm">${i18n.t('profile.twoFactorDescription')}</p>
                      </div>
                      <div class="flex items-center justify-center sm:justify-end">
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            id="twoFactorToggle" 
                            ${currentUser.twoFactorEnabled ? 'checked' : ''} 
                            class="sr-only peer"
                          >
                          <div class="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div id="twoFactorContent" class="${currentUser.twoFactorEnabled ? '' : 'hidden'}">
                      <div class="space-y-4">
                        <div class="flex items-center justify-between bg-white/5 rounded-xl p-4">
                          <div>
                            <p class="text-white font-medium">${i18n.t('profile.statusEnabled')}</p>
                            <p class="text-white/70 text-sm">${i18n.t('profile.accountProtected')}</p>
                          </div>
                          <div class="text-green-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        
                        <button 
                          id="show-backup-codes-btn"
                          class="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-4 sm:py-3 px-4 transition-all duration-300 border border-white/20 hover:border-white/30 text-base sm:text-sm"
                        >
                          ${i18n.t('profile.viewBackupCodes')}
                        </button>
                      </div>
                    </div>
                    
                    <div id="twoFactorSetup" class="${currentUser.twoFactorEnabled ? 'hidden' : ''}">
                      <p class="text-white/70 text-sm mb-4 text-center sm:text-left">${i18n.t('profile.enable2FADescription')}</p>
                      <button 
                        id="setup-2fa-btn"
                        class="w-full bg-gradient-to-r from-purple-500/90 to-purple-600/90 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl py-4 sm:py-3 px-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] border border-purple-400/30 text-base sm:text-sm font-medium"
                      >
                        ${i18n.t('profile.setup2FA')}
                      </button>
                    </div>
                  </div>

                  <!-- Account Actions -->
                  
                </div>


              </div>
            </div>

          <!-- Loading Indicator -->
          <div id="loading-indicator" class="hidden mt-4 text-center relative z-10">
            <div class="bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div class="loader mx-auto border-4 border-white/30 border-t-white rounded-full w-8 h-8 animate-spin"></div>
              <p class="text-white/80 text-sm mt-2">${i18n.t('common.processing')}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
  
  setupProfileEvents();
}

function setupProfileEvents() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Back to dashboard
  document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
    navigateTo('/dashboard');
  });

  // Profile picture upload
  const pictureUpload = document.getElementById('picture-upload') as HTMLInputElement;
  pictureUpload?.addEventListener('change', handlePictureUpload);

  // Profile form submission
  const profileForm = document.getElementById('profile-form') as HTMLFormElement;
  profileForm?.addEventListener('submit', handleProfileUpdate);

  // Password form submission (if not Google user)
  if (!currentUser.isGoogleUser) {
    const passwordForm = document.getElementById('password-form') as HTMLFormElement;
    passwordForm?.addEventListener('submit', handlePasswordChange);

    // Password strength indicator
    const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
    newPasswordInput?.addEventListener('input', updatePasswordStrength);
  }

  // Google sync button (if Google user)
  if (currentUser.isGoogleUser) {
    document.getElementById('sync-google-btn')?.addEventListener('click', handleGoogleSync);
  }

  // Two-factor authentication toggle
  const twoFactorToggle = document.getElementById('twoFactorToggle') as HTMLInputElement;
  twoFactorToggle?.addEventListener('change', handleTwoFactorToggle);

  // Setup 2FA button
  document.getElementById('setup-2fa-btn')?.addEventListener('click', handleSetup2FA);

  // Show backup codes button
  document.getElementById('show-backup-codes-btn')?.addEventListener('click', showBackupCodes);

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  
  // Modify theme button
  document.getElementById('modify-theme-btn')?.addEventListener('click', showThemeEditor);
}

function handlePictureUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const imgEl = document.getElementById('current-picture') as HTMLImageElement | null;
  if (!input.files || !input.files[0] || !imgEl) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    imgEl.src = (reader.result as string) || '/assets/default-avatar.svg';
  };
  reader.readAsDataURL(file);
}

interface ProfileUpdateResponse {
  user: any; // Adjust type as per User interface
}

async function handleProfileUpdate(event: Event) {
  event.preventDefault();
  
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  
  const fullName = (document.getElementById('fullName') as HTMLInputElement).value;
  const nickName = (document.getElementById('nickname') as HTMLInputElement).value;
  const pictureUpload = document.getElementById('picture-upload') as HTMLInputElement;
  
  if (!nickName.trim()) {
    showToast(i18n.t('profile.nicknameRequired'), 'error');
    return;
  }
  
  showLoading(true);
  
  try {
    const updateData: any = { nickName };
    
    const currentUser = getCurrentUser();
    if (!currentUser?.isGoogleUser && fullName.trim()) {
      updateData.fullName = fullName;
    }
    
    // Handle picture upload
    if (pictureUpload.files?.[0]) {
      const pictureFormData = new FormData();
      pictureFormData.append('picture', pictureUpload.files[0]);
      
      // You would implement picture upload endpoint
      // For now, we'll include it in the profile update
      updateData.picture = await convertFileToBase64(pictureUpload.files[0]);
    }
    
    const response: ProfileUpdateResponse = await api.put('profile', updateData);
    
    if (response.user) {
      setCurrentUser(response.user);
      showToast(i18n.t('profile.profileUpdated'), 'success');
    }
  } catch (error: any) {
    console.error('Profile update error:', error);
    showToast(error.response?.data?.message || i18n.t('profile.updateFailed'), 'error');
  } finally {
    showLoading(false);
  }
}

async function handlePasswordChange(event: Event) {
  event.preventDefault();
  
  const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
  const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
  
  if (newPassword !== confirmPassword) {
    showToast(i18n.t('profile.passwordsDoNotMatch'), 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast(i18n.t('profile.passwordTooShort'), 'error');
    return;
  }
  
  showLoading(true);
  
  try {
    await api.put('profile/password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    
    showToast(i18n.t('profile.passwordChanged'), 'success');
    
    // Clear form
    (document.getElementById('password-form') as HTMLFormElement).reset();
    updatePasswordStrength();  // Hide strength indicator after reset
  } catch (error: any) {
    console.error('Password change error:', error);
    showToast(error.response?.data?.message || i18n.t('profile.passwordChangeFailed'), 'error');
  } finally {
    showLoading(false);
  }
}

function updatePasswordStrength() {
  const password = (document.getElementById('newPassword') as HTMLInputElement).value;
  const strengthEl = document.getElementById('password-strength')!;
  
  if (password.length === 0) {
    strengthEl.classList.add('hidden');
    return;
  }
  
  const strength = calculatePasswordStrength(password);
  strengthEl.classList.remove('hidden');
  strengthEl.textContent = `${i18n.t('profile.strength')}: ${strength}`;
  strengthEl.className = `mt-1 text-sm ${
    strength === 'Strong' ? 'text-green-300' : 
    strength === 'Medium' ? 'text-yellow-300' : 
    'text-red-300'
  }`;
}

function calculatePasswordStrength(password: string): string {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score < 3) return i18n.t('profile.weak');
  if (score < 5) return i18n.t('profile.medium');
  return i18n.t('profile.strong');
}

async function handleGoogleSync() {
  showLoading(true);
  
  try {
    // Obtain a fresh Google ID token
    const googleToken = await requestGoogleIdToken();

    const response = await api.post('profile/sync-google', { googleToken });
    
    if ((response as any).user) {
      setCurrentUser((response as any).user);
      showToast(i18n.t('profile.googleSyncSuccess'), 'success');
      
      // Refresh the page to show updated data
      renderProfile();
    }
  } catch (error: any) {
    console.error('Google sync error:', error);
    showToast(error.response?.data?.message || error.message || i18n.t('profile.googleSyncFailed'), 'error');
  } finally {
    showLoading(false);
  }
}

async function handleTwoFactorToggle(event: Event) {
  const toggle = event.target as HTMLInputElement;
  const isEnabled = toggle.checked;
  
  if (isEnabled) {
    // Show setup process
    handleSetup2FA();
  } else {
    // Prompt for confirmation and verification
    if (!confirm(i18n.t('profile.disable2FAConfirm'))) {
      toggle.checked = true;
      return;
    }
    showDisable2FAModal();
  }
}

interface Setup2FAResponse {
  qrCode: string;
  secret: string;
}

async function handleSetup2FA() {
  showLoading(true);
  
  try {
    const response: Setup2FAResponse = await api.post('profile/2fa/setup', {});
    
    const { qrCode, secret } = response;
    
    // Show 2FA setup modal
    show2FASetupModal(qrCode, secret);
  } catch (error: any) {
    console.error('2FA setup error:', error);
    showToast(error.response?.data?.message || i18n.t('profile.setup2FAFailed'), 'error');
  } finally {
    showLoading(false);
  }
}

function show2FASetupModal(qrCode: string, secret: string) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-w-md w-full">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-4 sm:space-y-6">
        <h3 class="text-lg sm:text-xl font-semibold text-white text-center">${i18n.t('profile.setup2FA')}</h3>
        
        <div class="text-center space-y-3 sm:space-y-4">
          <p class="text-white/80 text-xs sm:text-sm">${i18n.t('profile.scanQRCode')}</p>
          <div class="bg-white p-2 sm:p-3 md:p-4 rounded-xl mx-auto inline-block">
            <img src="${qrCode}" alt="2FA QR Code" class="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
          </div>
          
          <div class="text-left">
            <label class="block text-xs sm:text-sm font-medium text-white mb-1">${i18n.t('profile.enterSecretManually')}</label>
            <div class="bg-white/10 border border-white/20 rounded-xl p-2 sm:p-3 relative">
              <code class="text-white text-xs sm:text-sm break-all pr-8">${secret}</code>
              <button 
                class="copy-secret absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded transition-all duration-200"
                data-secret="${secret}"
                title="${i18n.t('common.copy')}"
              >
                <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <label for="verification-code" class="block text-xs sm:text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.enterVerificationCode')}</label>
            <input 
              type="text" 
              id="verification-code" 
              class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-sm sm:text-base text-center"
              placeholder="000000"
              maxlength="6"
              required
            >
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button 
            id="cancel-2fa"
            class="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 transition-all duration-300 border border-white/20 text-sm sm:text-base"
          >
            ${i18n.t('common.cancel')}
          </button>
          <button 
            id="verify-2fa"
            class="flex-1 bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-500 hover:to-green-600 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 transition-all duration-300 shadow-lg border border-green-400/30 text-sm sm:text-base"
          >
            ${i18n.t('profile.verifyAndEnable')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add copy functionality for secret
  modal.querySelector('.copy-secret')?.addEventListener('click', async (e) => {
    const secret = (e.currentTarget as HTMLElement).getAttribute('data-secret');
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        showToast(i18n.t('common.copied'), 'success');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = secret;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(i18n.t('common.copied'), 'success');
      }
    }
  });
  
  // Setup modal events
  modal.querySelector('#cancel-2fa')?.addEventListener('click', () => {
    document.body.removeChild(modal);
    // Reset toggle
    const toggle = document.getElementById('twoFactorToggle') as HTMLInputElement;
    toggle.checked = false;
  });
  
  modal.querySelector('#verify-2fa')?.addEventListener('click', async () => {
    const code = (modal.querySelector('#verification-code') as HTMLInputElement).value;
    if (code.length !== 6) {
      showToast(i18n.t('profile.enter6DigitCode'), 'error');
      return;
    }
    
    await verify2FA(code, modal);
  });
}

interface Enable2FAResponse {
  user: any;
  backupCodes: string[];
}

async function verify2FA(code: string, modal: HTMLElement) {
  try {
    const response: Enable2FAResponse = await api.post('profile/2fa/enable', {
      token: code
    });
    
    const { user, backupCodes } = response;
    
    setCurrentUser(user);
    document.body.removeChild(modal);
    
    // Show backup codes
    showBackupCodesModal(backupCodes);
    
    showToast(i18n.t('profile.twoFactorEnabled'), 'success');
    
    // Update UI
    renderProfile();
  } catch (error: any) {
    console.error('2FA verification error:', error);
    showToast(error.response?.data?.message || i18n.t('profile.invalidVerificationCode'), 'error');
  }
}

interface Disable2FAResponse {
  user: any;
}

async function disable2FA(token: string) {
  showLoading(true);
  
  try {
    const response: Disable2FAResponse = await api.post('profile/2fa/disable', { token });
    
    if (response.user) {
      setCurrentUser(response.user);
      showToast(i18n.t('profile.twoFactorDisabled'), 'success');
      
      // Update UI
      renderProfile();
    }
  } catch (error: any) {
    console.error('2FA disable error:', error);
    showToast(error.response?.data?.message || i18n.t('profile.disable2FAFailed'), 'error');
    
    // Reset toggle
    const toggle = document.getElementById('twoFactorToggle') as HTMLInputElement;
    toggle.checked = true;
  } finally {
    showLoading(false);
  }
}

function showDisable2FAModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-w-md w-full">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-4 sm:space-y-6">
        <h3 class="text-lg sm:text-xl font-semibold text-white text-center">${i18n.t('profile.disable2FA')}</h3>
        
        <div class="text-center space-y-3 sm:space-y-4">
          <p class="text-white/80 text-xs sm:text-sm">${i18n.t('profile.disable2FAInstruction')}</p>
          
          <div>
            <label for="disable-verification-code" class="block text-xs sm:text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.verificationCode')}</label>
            <input 
              type="text" 
              id="disable-verification-code" 
              class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-sm sm:text-base text-center"
              placeholder="000000"
              maxlength="6"
              required
            >
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button 
            id="cancel-disable-2fa"
            class="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 transition-all duration-300 border border-white/20 text-sm sm:text-base"
          >
            ${i18n.t('common.cancel')}
          </button>
          <button 
            id="confirm-disable-2fa"
            class="flex-1 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 transition-all duration-300 shadow-lg border border-red-400/30 text-sm sm:text-base"
          >
            ${i18n.t('profile.verifyAndDisable')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#cancel-disable-2fa')?.addEventListener('click', () => {
    document.body.removeChild(modal);
    // Reset toggle
    const toggle = document.getElementById('twoFactorToggle') as HTMLInputElement;
    toggle.checked = true;
  });
  
  modal.querySelector('#confirm-disable-2fa')?.addEventListener('click', async () => {
    const code = (modal.querySelector('#disable-verification-code') as HTMLInputElement).value;
    if (code.length !== 6) {
      showToast(i18n.t('profile.enter6DigitCode'), 'error');
      return;
    }
    
    await disable2FA(code);
    document.body.removeChild(modal);
  });
}

function showBackupCodes(event?: Event) {
  const currentUser = getCurrentUser();
  if (!currentUser?.twoFactorBackupCodes) {
    showToast(i18n.t('profile.noBackupCodes'), 'error');
    return;
  }
  
  const codes = JSON.parse(currentUser.twoFactorBackupCodes);
  showBackupCodesModal(codes);
}

function showBackupCodesModal(codes: string[]) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-w-md w-full">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-4 sm:space-y-6">
        <h3 class="text-lg sm:text-xl font-semibold text-white text-center">${i18n.t('profile.backupCodes')}</h3>
        
        <div class="space-y-3 sm:space-y-4">
          <p class="text-white/80 text-xs sm:text-sm">${i18n.t('profile.saveBackupCodes')}</p>
          
          <div class="bg-white/10 border border-white/20 rounded-xl p-3 sm:p-4 space-y-2">
            ${codes.map((code, index) => `
              <div class="bg-white/5 rounded-lg p-2 sm:p-3 flex items-center justify-between group">
                <code class="text-white font-mono text-xs sm:text-sm flex-1 text-center">${code}</code>
                <button 
                  class="copy-backup-code ml-2 sm:ml-3 p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100"
                  data-code="${code}"
                  title="${i18n.t('common.copy')}"
                >
                  <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 sm:p-4">
            <p class="text-yellow-200 text-xs sm:text-sm">
              ⚠️ ${i18n.t('profile.backupCodesWarning')}
            </p>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button 
            id="copy-all-codes"
            class="flex-1 bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-500 hover:to-green-600 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 transition-all duration-300 shadow-lg border border-green-400/30 text-sm sm:text-base"
          >
            ${i18n.t('common.copyAll')}
          </button>
          <button 
            id="close-backup-codes"
            class="flex-1 bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 transition-all duration-300 shadow-lg border border-blue-400/30 text-sm sm:text-base"
          >
            ${i18n.t('profile.savedCodes')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add copy functionality for individual codes
  modal.querySelectorAll('.copy-backup-code').forEach(button => {
    button.addEventListener('click', async (e) => {
      const code = (e.currentTarget as HTMLElement).getAttribute('data-code');
      if (code) {
        try {
          await navigator.clipboard.writeText(code);
          showToast(i18n.t('common.copied'), 'success');
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showToast(i18n.t('common.copied'), 'success');
        }
      }
    });
  });
  
  // Add copy all functionality
  modal.querySelector('#copy-all-codes')?.addEventListener('click', async () => {
    const allCodes = codes.join('\n');
    try {
      await navigator.clipboard.writeText(allCodes);
      showToast(i18n.t('common.allCodesCopied'), 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = allCodes;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(i18n.t('common.allCodesCopied'), 'success');
    }
  });
  
  modal.querySelector('#close-backup-codes')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

async function handleLogout() {
  // Use NavigationManager which handles its own confirmation dialog
  await navigationManager.handleLogout();
}

function showLoading(show: boolean) {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.classList.toggle('hidden', !show);
  }
}

function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}