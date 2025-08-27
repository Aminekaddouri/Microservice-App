import { api } from "@/services/api";
import { setCurrentUser } from "./authState";
import { saveTokens } from "./auth";
import { navigateTo } from "./router";
import { User } from "@/types/user";
import { i18n } from "@/services/i18n";

// Add this function
interface GoogleAuthResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: User; // Assuming User type is defined elsewhere
    message?: string;
    pending2fa?: boolean;
    tempToken?: string;
}

function getActiveLoadingIndicator(): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll('#loading-indicator')) as HTMLElement[];
  return nodes.length ? nodes[nodes.length - 1] : null;
}

async function handleCredentialResponse(response: { credential: string }) {
    try {
        // Hide loading indicator if present
        const loadingIndicatorEl = getActiveLoadingIndicator();
        if (loadingIndicatorEl) {
            loadingIndicatorEl.classList.add('hidden');
        }

        // Adjust if api.googleAuth expects a string; assuming it does based on error
        const res: GoogleAuthResponse = await api.googleAuth({ token: response.credential });

        if (res.success) {
            if (res.pending2fa && res.tempToken) {
                showToast(i18n.t('auth.twoFactorAuthRequired'), 'success');
                // Reuse 2FA UI from LoginPage via custom event (avoid circular import)
                document.dispatchEvent(new CustomEvent('show-2fa-form', { detail: { tempToken: res.tempToken } }));
                return;
            }
            if (res.accessToken && res.user) {
                saveTokens(res.accessToken);
                setCurrentUser(res.user);
                try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
                showToast(i18n.t('auth.loginSuccessful'), 'success');
                navigateTo('/');
            } else {
                showToast(i18n.t('auth.loginFailedMissingData'), 'error');
            }
        } else {
            showToast(i18n.t('auth.loginFailed') + ': ' + (res.message ?? i18n.t('auth.unknownError')), 'error');
        }
    } catch (error: unknown) {
        console.error('Credential handling error:', error);
        const errorMessage = error instanceof Error ? error.message : i18n.t('auth.unknownError');
        showToast(i18n.t('auth.authenticationError') + ': ' + errorMessage, 'error');
    }
}

export function showToast(message: string, type: 'success' | 'error' = 'success') {
    let toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed bottom-5 right-5 px-4 py-2 rounded shadow-lg text-white z-50 transition-opacity duration-300 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Fixed Google Sign-In implementation
export function initGoogleSignIn() {
    // @ts-ignore
    if (window.google && window.google.accounts) {
        try {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: '301688985342-pnrl5r3271ibvb0llqbqehj006o121tf.apps.googleusercontent.com',
                callback: handleCredentialResponse,
                use_fedcm_for_prompt: true,
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            const customBtn = document.getElementById('google-signin-btn');
            if (customBtn) {
                customBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    
                    const loadingIndicatorEl = getActiveLoadingIndicator();
                    if (loadingIndicatorEl) {
                        loadingIndicatorEl.classList.remove('hidden');
                    }
                    
                    // Inside the try block of customBtn.addEventListener
                    try {
                        // @ts-ignore
                        window.google.accounts.id.prompt();
                    } catch (error) {
                        console.error('Google Sign-In prompt error:', error);
                        const li = getActiveLoadingIndicator();
                        if (li) {
                            li.classList.add('hidden');
                        }
                        
                        // Enhanced check for FedCM network error and blocked log requests
                        if ((error as Error).message?.includes('FedCM') && (error as Error).message?.includes('NetworkError')) {
                            showToast(i18n.t('auth.googleSignInFedCMError'), 'error');
                        } else if ((error as Error).message?.includes('blocked') || (error as Error).message?.includes('ERR_BLOCKED_BY_CLIENT')) {
                            showToast(i18n.t('auth.googleSignInBlockedByExtension'), 'error');
                        } else {
                            showToast(i18n.t('auth.googleSignInTemporarilyUnavailable'), 'error');
                        }
                        
                        // Fallback to direct OAuth
                        setTimeout(() => {
                            initiateGoogleSignIn();
                        }, 1500);
                    }
                });
            }
        } catch (error) {
            console.error('Google Sign-In initialization error:', error);
        }
    }
}

// Request a fresh Google ID token (for profile sync)
export function requestGoogleIdToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // @ts-ignore
            if (!window.google || !window.google.accounts || !window.google.accounts.id) {
                reject(new Error(i18n.t('auth.googleSDKNotLoaded')));
                return;
            }
            // One-time callback to capture credential
            const onCredential = (response: { credential: string }) => {
                if (response?.credential) {
                    resolve(response.credential);
                } else {
                    reject(new Error(i18n.t('auth.noCredentialReceived')));
                }
            };
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: '301688985342-pnrl5r3271ibvb0llqbqehj006o121tf.apps.googleusercontent.com',
                callback: onCredential,
                use_fedcm_for_prompt: true,
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            // @ts-ignore
            window.google.accounts.id.prompt((notification: any) => {
                try {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        reject(new Error(i18n.t('auth.googleSignInCancelledOrNotDisplayed')));
                    }
                } catch (_) {
                    // ignore notification interface differences
                }
            });
        } catch (e) {
            reject(e as Error);
        }
    });
}

export async function initiateGoogleSignIn() {
    const clientId = '301688985342-pnrl5r3271ibvb0llqbqehj006o121tf.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:3000';

    const codeVerifier = generateRandomString(64);
    const challenge = await pkceChallenge(codeVerifier);

    try { localStorage.setItem('code_verifier', codeVerifier); } catch {}

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid email profile')}&` +
    `code_challenge=${challenge}&` +
    `code_challenge_method=S256`;

    window.location.href = authUrl;
}

export async function handleGoogleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) return;

    const codeVerifier = localStorage.getItem('code_verifier') || undefined;

    try {
        const res: GoogleAuthResponse = await api.googleAuth({ code, codeVerifier });
        if (res.success && res.accessToken && res.user) {
            saveTokens(res.accessToken);
            setCurrentUser(res.user);
            try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
            showToast(i18n.t('auth.loginSuccessful'), 'success');
            navigateTo('/');
        } else {
            showToast(i18n.t('auth.loginFailed') + ': ' + (res.message ?? i18n.t('auth.unknownError')), 'error');
        }
    } catch (error: any) {
        console.error('Google callback error:', error);
        showToast(i18n.t('auth.authenticationError') + ': ' + (error?.message || i18n.t('auth.unknownError')), 'error');
    } finally {
        // Cleanup URL params
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

function generateRandomString(length: number) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

async function pkceChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const loadingIndicator = `
    <div id="loading-indicator" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
      <div class="loader border-4 border-blue-300 border-t-blue-600 rounded-full w-12 h-12 animate-spin"></div>
    </div>
  `;