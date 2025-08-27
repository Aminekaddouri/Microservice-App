import { api } from "@/services/api";
import { User } from "@/types/user";
import { isLoggedIn, getAccessToken, logout } from "@/utils/auth";
import { getCurrentUser, setCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { showToast, requestGoogleIdToken } from "@/utils/utils";
import { i18n } from "@/services/i18n";
import { themeService } from "@/services/themeService";

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
    <main class="w-full h-full flex items-center justify-center overflow-hidden">
      <section 
        class="relative w-full h-full bg-transparent flex flex-col items-center justify-center overflow-y-auto py-4 px-4"
      >

        <!-- Content -->
        <div class="relative z-10 w-full max-w-4xl text-center">
          <!-- Container -->
            
            <!-- Content inside container -->
            <div class="relative z-10 space-y-8">
              <!-- Header -->
              <header class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <h1 class="font-semibold text-white text-3xl md:text-4xl drop-shadow-lg">
                    ${i18n.t('profile.profileSettings')}
                  </h1>
                  <img 
                    src="https://c.animaapp.com/meotu59csaTQmy/img/image-1.png"
                    alt="ft_pong logo"
                    class="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg"
                  />
                </div>
              
              </header>

              <!-- Profile Sections -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Personal Information Section -->
                <div class="space-y-6">
                  <h2 class="text-xl font-semibold text-white text-left">${i18n.t('profile.personalInformation')}</h2>
                  
                  ${currentUser.isGoogleUser ? `
                    <div class="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 flex items-center gap-3 mb-6">
                      <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.545 10.253v3.261h5.084c-.186 1.626-1.555 2.927-3.429 2.927-2.073 0-3.754-1.681-3.754-3.754 0-2.073 1.681-3.754 3.754-3.754 1.137 0 2.174.426 2.968 1.126l2.104-2.104c-1.281-1.206-2.959-1.953-5.072-1.953-3.144 0-5.696 2.552-5.696 5.696s2.552 5.696 5.696 5.696c3.31 0 5.515-2.324 5.515-5.616 0-.567-.058-1.123-.172-1.629H12.545z"/>
                      </svg>
                      <span class="text-blue-200">${i18n.t('profile.googleAccountNote')}</span>
                    </div>
                  ` : ''}
                  <!-- Profile Picture -->
                  <div class="text-left">
                    <label class="block text-sm font-medium text-white mb-2">${i18n.t('profile.profilePicture')}</label>
                    <div class="flex items-center gap-4">
                      <div class="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center overflow-hidden shadow-md">
                        <img 
                          id="current-picture" 
                          src="${currentUser.picture || '/assets/default-avatar.svg'}" 
                          alt="Profile" 
                          class="object-cover w-full h-full"
                        >
                        <span id="picture-placeholder" class="hidden"></span>
                      </div>
                      <div class="space-y-2">
                        <label 
                          for="picture-upload" 
                          class="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30 text-sm ${currentUser.isGoogleUser ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}"
                        >
                          ${i18n.t('profile.changePicture')}
                        </label>
                        <input type="file" id="picture-upload" accept="image/jpeg,image/png" class="hidden" ${currentUser.isGoogleUser ? 'disabled' : ''}>
                        ${currentUser.isGoogleUser ? `<p class="text-xs text-orange-300">${i18n.t('profile.googlePictureSync')}</p>` : ''}
                      </div>
                    </div>
                  </div>

                  <!-- Personal Info Form -->
                  <form id="profile-form" class="space-y-4">
                    <div>
                      <label for="fullName" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.fullName')}</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        value="${currentUser.fullName || ''}"
                        ${currentUser.isGoogleUser ? 'readonly' : ''}
                        class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all ${currentUser.isGoogleUser ? 'opacity-60 cursor-not-allowed' : ''}"
                        placeholder="${i18n.t('profile.enterFullName')}"
                      >
                      ${currentUser.isGoogleUser ? `<p class="text-xs text-orange-300 mt-1">${i18n.t('profile.googleNameSync')}</p>` : ''}
                    </div>
                    
                    <div>
                      <label for="nickname" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.nickname')}</label>
                      <input 
                        type="text" 
                        id="nickname" 
                        value="${currentUser.nickName || ''}"
                        class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="${i18n.t('profile.enterNickname')}"
                        required
                      >
                    </div>
                    
                    <div>
                      <label for="email" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.email')}</label>
                      <input 
                        type="email" 
                        id="email" 
                        value="${currentUser.email || ''}"
                        readonly
                        class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white/60 cursor-not-allowed"
                      >
                      <p class="text-xs text-white/60 mt-1">${i18n.t('profile.emailCannotChange')}</p>
                    </div>

                    <button 
                      type="submit" 
                      class="group relative overflow-hidden w-full bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-blue-400/30"
                    >
                      <span class="relative z-10">${i18n.t('profile.updateProfile')}</span>
                      <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                    </button>
                  </form>

                  <!-- Google Sync Button (for Google users) -->
                  ${currentUser.isGoogleUser ? `
                    <button 
                      id="sync-google-btn"
                      class="group relative overflow-hidden w-full bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-500 hover:to-green-600 text-white rounded-2xl py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-green-400/30"
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
                </div>

                <!-- Security Section -->
                <div class="space-y-6">
                  <h2 class="text-xl font-semibold text-white text-left">${i18n.t('profile.securitySettings')}</h2>
                  
                  <!-- Password Change -->
                  ${!currentUser.isGoogleUser ? `
                    <div class="bg-white/5 border border-white/20 rounded-2xl p-6">
                      <h3 class="text-lg font-medium text-white mb-4 text-left">${i18n.t('profile.changePassword')}</h3>
                      <form id="password-form" class="space-y-4">
                        <div>
                          <label for="currentPassword" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.currentPassword')}</label>
                          <input 
                            type="password" 
                            id="currentPassword" 
                            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                            placeholder="${i18n.t('profile.enterCurrentPassword')}"
                            required
                          >
                        </div>
                        
                        <div>
                          <label for="newPassword" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.newPassword')}</label>
                          <input 
                            type="password" 
                            id="newPassword" 
                            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                            placeholder="${i18n.t('profile.enterNewPassword')}"
                            required
                            minlength="8"
                          >
                          <div id="password-strength" class="mt-1 text-sm hidden"></div>
                        </div>
                        
                        <div>
                          <label for="confirmPassword" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.confirmPassword')}</label>
                          <input 
                            type="password" 
                            id="confirmPassword" 
                            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                            placeholder="${i18n.t('profile.confirmNewPassword')}"
                            required
                          >
                        </div>

                        <button 
                          type="submit" 
                          class="group relative overflow-hidden w-full bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl py-3 px-6 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300 ease-out border border-orange-400/30"
                        >
                          <span class="relative z-10">${i18n.t('profile.changePassword')}</span>
                          <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                        </button>
                      </form>
                    </div>
                  ` : `
                    <div class="bg-white/5 border border-white/20 rounded-2xl p-6">
                      <h3 class="text-lg font-medium text-white mb-2 text-left">${i18n.t('profile.password')}</h3>
                      <p class="text-white/70 text-sm">${i18n.t('profile.googlePasswordNote')}</p>
                    </div>
                  `}

                  <!-- Two-Factor Authentication -->
                  <div class="bg-white/5 border border-white/20 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                      <div>
                        <h3 class="text-lg font-medium text-white text-left">${i18n.t('profile.twoFactorAuth')}</h3>
                        <p class="text-white/70 text-sm text-left">${i18n.t('profile.twoFactorDescription')}</p>
                      </div>
                      <div class="flex items-center">
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
                          class="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-4 transition-all duration-300 border border-white/20 hover:border-white/30 text-sm"
                        >
                          ${i18n.t('profile.viewBackupCodes')}
                        </button>
                      </div>
                    </div>
                    
                    <div id="twoFactorSetup" class="${currentUser.twoFactorEnabled ? 'hidden' : ''}">
                      <p class="text-white/70 text-sm mb-4">${i18n.t('profile.enable2FADescription')}</p>
                      <button 
                        id="setup-2fa-btn"
                        class="w-full bg-gradient-to-r from-purple-500/90 to-purple-600/90 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] border border-purple-400/30"
                      >
                        ${i18n.t('profile.setup2FA')}
                      </button>
                    </div>
                  </div>

                  <!-- Game Theme Customization -->
                  <div class="bg-white/5 border border-white/20 rounded-2xl p-6">
                    <h3 class="text-lg font-medium text-white mb-4 text-left">Game Theme</h3>
                    <p class="text-white/70 text-sm mb-4 text-left">Customize your game appearance with personalized colors</p>
                    <button 
                      id="modify-theme-btn"
                      class="group relative overflow-hidden w-full bg-gradient-to-r from-purple-500/90 to-purple-600/90 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] border border-purple-400/30"
                    >
                      <span class="relative z-10 flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5zM21 15a2 2 0 00-2-2h-4a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2z" />
                        </svg>
                        Modify Game Theme
                      </span>
                      <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                    </button>
                  </div>

                  <!-- Account Actions -->
                  <div class="bg-white/5 border border-white/20 rounded-2xl p-6">
                    <h3 class="text-lg font-medium text-white mb-4 text-left">${i18n.t('profile.accountActions')}</h3>
                    <button 
                      id="logout-btn"
                      class="w-full bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] border border-red-400/30"
                    >
                      ${i18n.t('profile.signOut')}
                    </button>
                  </div>
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
  document.getElementById('modify-theme-btn')?.addEventListener('click', handleModifyTheme);
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
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-6">
        <h3 class="text-xl font-semibold text-white text-center">${i18n.t('profile.setup2FA')}</h3>
        
        <div class="text-center space-y-4">
          <p class="text-white/80 text-sm">${i18n.t('profile.scanQRCode')}</p>
          <div class="bg-white p-4 rounded-xl mx-auto inline-block">
            <img src="${qrCode}" alt="2FA QR Code" class="w-48 h-48">
          </div>
          
          <div class="text-left">
            <label class="block text-sm font-medium text-white mb-1">${i18n.t('profile.enterSecretManually')}</label>
            <div class="bg-white/10 border border-white/20 rounded-xl p-3">
              <code class="text-white text-sm break-all">${secret}</code>
            </div>
          </div>
          
          <div>
            <label for="verification-code" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.enterVerificationCode')}</label>
            <input 
              type="text" 
              id="verification-code" 
              class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="000000"
              maxlength="6"
              required
            >
          </div>
        </div>
        
        <div class="flex gap-3">
          <button 
            id="cancel-2fa"
            class="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-4 transition-all duration-300 border border-white/20"
          >
            ${i18n.t('common.cancel')}
          </button>
          <button 
            id="verify-2fa"
            class="flex-1 bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-500 hover:to-green-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg border border-green-400/30"
          >
            ${i18n.t('profile.verifyAndEnable')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
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
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-6">
        <h3 class="text-xl font-semibold text-white text-center">${i18n.t('profile.disable2FA')}</h3>
        
        <div class="text-center space-y-4">
          <p class="text-white/80 text-sm">${i18n.t('profile.disable2FAInstruction')}</p>
          
          <div>
            <label for="disable-verification-code" class="block text-sm font-medium text-white mb-1 text-left">${i18n.t('profile.verificationCode')}</label>
            <input 
              type="text" 
              id="disable-verification-code" 
              class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="000000"
              maxlength="6"
              required
            >
          </div>
        </div>
        
        <div class="flex gap-3">
          <button 
            id="cancel-disable-2fa"
            class="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-4 transition-all duration-300 border border-white/20"
          >
            ${i18n.t('common.cancel')}
          </button>
          <button 
            id="confirm-disable-2fa"
            class="flex-1 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg border border-red-400/30"
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
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-6">
        <h3 class="text-xl font-semibold text-white text-center">${i18n.t('profile.backupCodes')}</h3>
        
        <div class="space-y-4">
          <p class="text-white/80 text-sm">${i18n.t('profile.saveBackupCodes')}</p>
          
          <div class="bg-white/10 border border-white/20 rounded-xl p-4 space-y-2">
            ${codes.map(code => `
              <div class="bg-white/5 rounded-lg p-2 text-center">
                <code class="text-white font-mono">${code}</code>
              </div>
            `).join('')}
          </div>
          
          <div class="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
            <p class="text-yellow-200 text-sm">
              ⚠️ ${i18n.t('profile.backupCodesWarning')}
            </p>
          </div>
        </div>
        
        <button 
          id="close-backup-codes"
          class="w-full bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg border border-blue-400/30"
        >
          ${i18n.t('profile.savedCodes')}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#close-backup-codes')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

async function handleLogout() {
  if (confirm(i18n.t('profile.signOutConfirm'))) {
    await logout();
    navigateTo('/login');
  }
}

function handleModifyTheme() {
  showThemeEditorModal();
}

function showThemeEditorModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
      <div class="relative z-10 space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-2xl font-semibold text-white">Game Theme Editor</h3>
          <button id="close-theme-editor" class="text-white/60 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Color Pickers -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-white">Customize Colors</h4>
            
            <div class="space-y-3">
              <div>
                <label for="board-color" class="block text-sm font-medium text-white mb-2">Board Background</label>
                <div class="flex items-center gap-3">
                  <input type="color" id="board-color" value="#1a1a2e" class="w-12 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer">
                  <input type="text" id="board-color-text" value="#1a1a2e" class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm">
                </div>
              </div>
              
              <div>
                <label for="left-paddle-color" class="block text-sm font-medium text-white mb-2">Left Paddle</label>
                <div class="flex items-center gap-3">
                  <input type="color" id="left-paddle-color" value="#00ff88" class="w-12 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer">
                  <input type="text" id="left-paddle-color-text" value="#00ff88" class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm">
                </div>
              </div>
              
              <div>
                <label for="right-paddle-color" class="block text-sm font-medium text-white mb-2">Right Paddle</label>
                <div class="flex items-center gap-3">
                  <input type="color" id="right-paddle-color" value="#ff6b6b" class="w-12 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer">
                  <input type="text" id="right-paddle-color-text" value="#ff6b6b" class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm">
                </div>
              </div>
              
              <div>
                <label for="ball-color" class="block text-sm font-medium text-white mb-2">Ball</label>
                <div class="flex items-center gap-3">
                  <input type="color" id="ball-color" value="#ffffff" class="w-12 h-12 rounded-lg border border-white/20 bg-transparent cursor-pointer">
                  <input type="text" id="ball-color-text" value="#ffffff" class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Preview -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-white">Preview</h4>
            <div id="theme-preview" class="w-full h-64 rounded-lg border border-white/20 relative overflow-hidden" style="background-color: #1a1a2e;">
              <!-- Game Preview -->
              <div class="absolute inset-4 border border-white/20 rounded">
                <!-- Left Paddle -->
                <div id="preview-left-paddle" class="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-16 rounded" style="background-color: #00ff88;"></div>
                <!-- Right Paddle -->
                <div id="preview-right-paddle" class="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-16 rounded" style="background-color: #ff6b6b;"></div>
                <!-- Ball -->
                <div id="preview-ball" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style="background-color: #ffffff;"></div>
                <!-- Center Line -->
                <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 transform -translate-x-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 pt-4">
          <button id="reset-theme" class="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-4 transition-all duration-300 border border-white/20">
            Reset to Default
          </button>
          <button id="save-theme" class="flex-1 bg-gradient-to-r from-purple-500/90 to-purple-600/90 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl py-3 px-4 transition-all duration-300 shadow-lg border border-purple-400/30">
            Save Theme
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupThemeEditorEvents(modal);
}

function setupThemeEditorEvents(modal: HTMLElement) {
  // Close modal
  modal.querySelector('#close-theme-editor')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Color picker synchronization
  const colorInputs = [
    { picker: '#board-color', text: '#board-color-text', preview: '#theme-preview' },
    { picker: '#left-paddle-color', text: '#left-paddle-color-text', preview: '#preview-left-paddle' },
    { picker: '#right-paddle-color', text: '#right-paddle-color-text', preview: '#preview-right-paddle' },
    { picker: '#ball-color', text: '#ball-color-text', preview: '#preview-ball' }
  ];
  
  colorInputs.forEach(({ picker, text, preview }) => {
    const pickerEl = modal.querySelector(picker) as HTMLInputElement;
    const textEl = modal.querySelector(text) as HTMLInputElement;
    const previewEl = modal.querySelector(preview) as HTMLElement;
    
    // Sync picker to text
    pickerEl?.addEventListener('input', () => {
      textEl.value = pickerEl.value;
      if (previewEl) {
        previewEl.style.backgroundColor = pickerEl.value;
      }
    });
    
    // Sync text to picker (with validation)
    textEl?.addEventListener('input', () => {
      if (isValidColor(textEl.value)) {
        pickerEl.value = textEl.value;
        if (previewEl) {
          previewEl.style.backgroundColor = textEl.value;
        }
      }
    });
  });
  
  // Reset theme
  modal.querySelector('#reset-theme')?.addEventListener('click', () => {
    const defaults = {
      '#board-color': '#1a1a2e',
      '#left-paddle-color': '#00ff88',
      '#right-paddle-color': '#ff6b6b',
      '#ball-color': '#ffffff'
    };
    
    Object.entries(defaults).forEach(([selector, color]) => {
      const pickerEl = modal.querySelector(selector) as HTMLInputElement;
      const textEl = modal.querySelector(selector + '-text') as HTMLInputElement;
      const previewEl = modal.querySelector(selector.replace('-color', '').replace('#', '#preview-')) as HTMLElement;
      
      if (pickerEl) pickerEl.value = color;
      if (textEl) textEl.value = color;
      if (previewEl) previewEl.style.backgroundColor = color;
    });
    
    // Update preview background
    const previewEl = modal.querySelector('#theme-preview') as HTMLElement;
    if (previewEl) previewEl.style.backgroundColor = defaults['#board-color'];
  });
  
  // Save theme
  modal.querySelector('#save-theme')?.addEventListener('click', async () => {
    await saveTheme(modal);
  });
  
  // Load current theme
  loadCurrentTheme(modal);
}

function isValidColor(color: string): boolean {
  // Check hex color format
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

async function loadCurrentTheme(modal: HTMLElement) {
  try {
    const theme = await themeService.getCurrentTheme();
    
    if (theme) {
      const colorMappings = {
        '#board-color': theme.board_color,
        '#left-paddle-color': theme.left_paddle_color,
        '#right-paddle-color': theme.right_paddle_color,
        '#ball-color': theme.ball_color
      };
      
      Object.entries(colorMappings).forEach(([selector, color]) => {
        if (color) {
          const pickerEl = modal.querySelector(selector) as HTMLInputElement;
          const textEl = modal.querySelector(selector + '-text') as HTMLInputElement;
          const previewEl = modal.querySelector(selector.replace('-color', '').replace('#', '#preview-')) as HTMLElement;
          
          if (pickerEl) pickerEl.value = color;
          if (textEl) textEl.value = color;
          if (previewEl) previewEl.style.backgroundColor = color;
        }
      });
      
      // Update preview background
      const previewEl = modal.querySelector('#theme-preview') as HTMLElement;
      if (previewEl && theme.board_color) {
        previewEl.style.backgroundColor = theme.board_color;
      }
    }
  } catch (error) {
    console.error('Failed to load current theme:', error);
  }
}

async function saveTheme(modal: HTMLElement) {
  const boardColor = (modal.querySelector('#board-color') as HTMLInputElement).value;
  const leftPaddleColor = (modal.querySelector('#left-paddle-color') as HTMLInputElement).value;
  const rightPaddleColor = (modal.querySelector('#right-paddle-color') as HTMLInputElement).value;
  const ballColor = (modal.querySelector('#ball-color') as HTMLInputElement).value;
  
  // Validate colors
  const colors = [boardColor, leftPaddleColor, rightPaddleColor, ballColor];
  if (!colors.every(isValidColor)) {
    showToast('Please enter valid hex color codes', 'error');
    return;
  }
  
  showLoading(true);
  
  try {
    await themeService.saveUserTheme({
      name: 'Custom Theme',
      board_color: boardColor,
      left_paddle_color: leftPaddleColor,
      right_paddle_color: rightPaddleColor,
      ball_color: ballColor
    });
    
    showToast('Theme saved successfully!', 'success');
    document.body.removeChild(modal);
  } catch (error: any) {
    console.error('Failed to save theme:', error);
    showToast(error.response?.data?.message || 'Failed to save theme', 'error');
  } finally {
    showLoading(false);
  }
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