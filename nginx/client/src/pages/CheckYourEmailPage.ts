import { api } from "@/services/api";
import { logout } from "@/utils/auth";
import { getCurrentUser } from "@/utils/authState";
import { navigateTo } from "@/utils/router";
import { loadingIndicator, showToast } from "@/utils/utils";
import { checkEmailVerification } from "./LoginPage";

export async function renderCheckYourEmailPage() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = loadingIndicator;
  const isVerified = await checkEmailVerification(getCurrentUser()!.id!);
  if (isVerified) {
    navigateTo('/dashboard');
    return;
  }
  app.innerHTML = `
    <div class="max-w-lg mx-auto mt-20 p-8 bg-white rounded-lg shadow-lg text-center">
      <h1 class="text-2xl font-bold text-blue-600 mb-4">📩 Check Your Email</h1>
      <p class="text-gray-700 text-base mb-6">
        A verification link has been sent to <strong>${getCurrentUser()?.email}</strong>. Please check your inbox and click the link to verify your account.
      </p>
      <p class="text-sm text-gray-500 mb-6">Didn't get the email?</p>
      <button id="resend-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 m-2 rounded transition">
        Resend Email
      </button>
      <button id="logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 m-2 rounded transition">
        Logout
      </button>
      <div id="loading-indicator" class="hidden mt-4 text-center">
          <div class="loader mx-auto border-4 border-blue-300 border-t-blue-600 rounded-full w-6 h-6 animate-spin"></div>
          <p class="text-sm text-gray-600 mt-2">Resending email verification...</p>
        </div>
    </div>
  `;

  const loader = document.getElementById('loading-indicator');
  const resendBtn = document.getElementById("resend-btn") as HTMLButtonElement | null;;
  const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement | null;;

  resendBtn?.addEventListener("click", async () => {
    if (loader) loader.classList.remove('hidden');
    if (resendBtn) resendBtn.disabled = true;
    if (logoutBtn) logoutBtn.disabled = true;
    try {
      const res = await api.resendVerificationEmail(getCurrentUser()!.id!);
      if (res.success) {
        showToast("Verification email resent successfully!", "success");
      } else {
        showToast("Failed to resend verification email.", "error");
      }
    } catch (err) {
      console.error("Resend error:", err);
      showToast("Error resending verification email", "error");
    } finally {
      if (loader) loader.classList.add('hidden');
      if (resendBtn) resendBtn.disabled = false;
      if (logoutBtn) logoutBtn.disabled = false;
    }
  });
  logoutBtn?.addEventListener("click", () => {
    logout();
    navigateTo('/');
  });
}