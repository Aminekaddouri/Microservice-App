import { api } from "@/services/api";
import { LoginCredentials } from "@/types/auth";
import { isLoggedIn, saveTokens } from "@/utils/auth";
import { setCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { initGoogleSignIn, showToast } from "@/utils/utils";



export function renderLogin() {
  if (isLoggedIn()) {
    navigateTo('/dashboard');
    return;
  }

  document.getElementById('app')!.innerHTML = `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
        <form id="login-form" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" id="password" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
          <button type="button" id="google" class="w-full  text-white py-2 rounded">Sign up with Google</button>
          <button type="button" id="signup" class="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500">Create Account</button>
        </form>
        <div id="loading-indicator" class="hidden mt-4 text-center">
          <div class="loader mx-auto border-4 border-blue-300 border-t-blue-600 rounded-full w-6 h-6 animate-spin"></div>
          
        </div>
      </div>
    </div>
  `;
  setupLoginEvents();
}

export function setupLoginEvents() {

  const form = document.getElementById('login-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      await loginMutation({ email, password });
    });

    document.getElementById('signup')!.addEventListener('click', () => {
      navigateTo('/signup');
    });
  }

  async function loginMutation(credentials: LoginCredentials): Promise<void> {
    const loader = document.getElementById('loading-indicator');
    const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (loader) loader.classList.remove('hidden');
    if (submitButton) submitButton.disabled = true;
    try {
      let response = await api.login(credentials);
      if (response && response.accessToken && response.refreshToken && response.success && response.user) {
        // const user = response.user;
        localStorage.setItem('user', JSON.stringify(response.user));
        setCurrentUser(response.user);
        saveTokens(response.accessToken, response.refreshToken);
        showToast("Login successful!", "success");
        checkEmailVerification(response.user.id!);
        // navigateTo('/dashboard');
      }
      else
        showToast(`Login error: ${response.message}`, "error");
    } catch (error) {
      showToast(`Login error: ${error}`, "error");
      console.error('Login error:', error);
    } finally {
      if (loader) loader.classList.add('hidden');
      if (submitButton) submitButton.disabled = false;
    }
  }
    initGoogleSignIn();

}

export async function checkEmailVerification(userId: string) :Promise<boolean> {
  try {
    // await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await api.isEmailVerified(userId);
    if (response.success) {
      if (!response.verified) {
        return false;
      } else {
        if (location.pathname !== '/dashboard')
          return true;
        else
          return true;
      }
    } else {
      console.error('Verification check failed:', response.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to check email verification:', error);
    return false;
  }

}


