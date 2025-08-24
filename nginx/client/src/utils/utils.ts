import { api } from "@/services/api";
import { setCurrentUser } from "./authState";
import { saveTokens } from "./auth";
import { navigateTo } from "./router";

export function showToast(message: string, type: 'success' | 'error' = 'success') {
    let toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed bottom-5 right-5 px-4 py-2 rounded shadow-lg text-white z-50 transition-opacity duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

export function initGoogleSignIn() {
    // @ts-ignore
    if (window.google && window.google.accounts) {
        // @ts-ignore
        window.google.accounts.id.initialize({
            client_id: '301688985342-pnrl5r3271ibvb0llqbqehj006o121tf.apps.googleusercontent.com',
            callback: handleCredentialResponse
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
            document.getElementById('google'),
            { theme: "filled_blue", size: "large", width: "100%" }
        );
    } else {
        console.error('Google Identity Services library not loaded');
    }
}

async function handleCredentialResponse(response: any) {
    const idToken = response.credential;
    // showToast('Verifying Google token with server...', 'success');
    try {
        const res = await api.googleAuth(idToken);
        console.log('response: ', res);
        if (res && res.accessToken && res.refreshToken && res.success && res.user) {
            localStorage.setItem('user', JSON.stringify(res.user));
            setCurrentUser(res.user);
            saveTokens(res.accessToken, res.refreshToken);
            showToast('Google signup successful!', 'success');
            navigateTo('/dashboard');
        }
        else {

            showToast(`Authentication failed: ${res.message || 'Unknown error'}`, 'error');
        }
    }
    catch (error) {
        showToast(`Error: ${error}`, 'error');
    };
}

export const loadingIndicator = `
    <div id="loading-indicator" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
      <div class="loader border-4 border-blue-300 border-t-blue-600 rounded-full w-12 h-12 animate-spin"></div>
    </div>
  `;