import { api } from "@/services/api";
import { User } from "@/types/user";
import { isLoggedIn, saveTokens } from "@/utils/auth";
import { getCurrentUser, setCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { initGoogleSignIn, showToast } from "@/utils/utils";

export function renderSignup() {
  if (isLoggedIn()) {
    navigateTo('/dashboard');
    return;
  }

  document.getElementById('app')!.innerHTML = `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center">Signup</h2>
        <form id="signup-form" class="space-y-4">
          <div>
            <label for="fullname" class="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="fullname" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <div>
            <label for="nickname" class="block text-sm font-medium text-gray-700">Nick Name</label>
            <input type="nickname" id="nickname" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <div>
            <label for="picture" class="block text-sm font-medium text-gray-700">Picture</label>
            <input type="picture" id="picture" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" id="password" class="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Account</button>
          <button type="button" id="google" class="w-full  text-white py-2 rounded">Sign up with Google</button>
          <button type="button" id="login" class="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500">Login</button>
        </form>
        <div id="loading-indicator" class="hidden mt-4 text-center">
          <div class="loader mx-auto border-4 border-blue-300 border-t-blue-600 rounded-full w-6 h-6 animate-spin"></div>
          <p class="text-sm text-gray-600 mt-2">Creating account...</p>
        </div>
      </div>
    </div>
  `;
  setupSignupEvents();
}

function setupSignupEvents() {
  const form = document.getElementById('signup-form') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = (document.getElementById('fullname') as HTMLInputElement).value;
      const nickName = (document.getElementById('nickname') as HTMLInputElement).value;
      const picture = (document.getElementById('picture') as HTMLInputElement).value;
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;

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
      navigateTo('/');
    });

    document.getElementById('google')!.addEventListener('click', () => {

    });
  }

  async function signupMutation(user: User): Promise<void> {
    const loader = document.getElementById('loading-indicator');
    const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (loader) loader.classList.remove('hidden');
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await api.signup(user);
      if (response.success) {
        showToast("Signup successful!", "success");
        navigateTo('/');
      }
      else
        showToast(`Signup failed: ${response.message}`, "error");


    } catch (error) {
      showToast(`Signup failed: ${error}`, "error");
      console.error('Signup error:', error);
    } finally {
      if (loader) loader.classList.add('hidden');
      if (submitButton) submitButton.disabled = false;
    }
  }





  // Initialize Google Sign-In when the page loads
  initGoogleSignIn();

}
