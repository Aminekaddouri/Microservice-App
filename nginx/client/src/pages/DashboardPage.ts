import { loadingIndicator, showToast } from '@/utils/utils';
import { logout, isLoggedIn, getAccessToken, getRefreshToken } from '../utils/auth';
import { navigateTo } from '../utils/router';
import { checkEmailVerification } from './LoginPage';
import { getCurrentUser } from '@/utils/authState';

export async function renderDashboard() {
  if (!isLoggedIn()) {
    navigateTo('/');
    return;
  }

  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = loadingIndicator;
  const isVerified = await checkEmailVerification(getCurrentUser()!.id!);
  if (!isVerified)
  {
    navigateTo('/email-verification');
    return ;
  }


  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center bg-green-100">
      <h1 class="text-3xl font-bold mb-4">Welcome to the Dashboard 🎉</h1>
      <div class="flex space-x-4 mb-6">
        <button id="chat-btn" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition duration-200">
          💬 Go to Chat
        </button>
        <button id="logout" class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition duration-200">
          🚪 Logout
        </button>
      </div>
    </div>
  `;

  // Add event listener for chat button
  document.getElementById('chat-btn')!.addEventListener('click', () => {
    navigateTo('/chat');
  });

  document.getElementById('logout')!.addEventListener('click', () => {
    logout();
    showToast("Logout successful!", "success");
    navigateTo('/');
  }); 
}