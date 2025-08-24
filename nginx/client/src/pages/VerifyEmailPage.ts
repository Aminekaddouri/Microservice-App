import { api } from "@/services/api";
import { navigateTo } from "@/utils/router";
import { showToast } from "@/utils/utils";

export function renderVerifyEmailPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("id");

    if (!token || !userId) {
        app.innerHTML = renderMessageCard("❌ Invalid verification link.", "text-red-600");
        return;
    }

    app.innerHTML = renderMessageCard("🔄 Verifying your email...", "text-blue-500", true);

    verifyEmailMutation(app, token, userId);
}

async function verifyEmailMutation(
    app: HTMLElement,
    token: string,
    userId: string,
): Promise<void> {
    try {
        const response = await api.verifyEmail(token, userId);
        if (response.success) {
            app.innerHTML = `
                <div class="flex items-center justify-center min-h-screen bg-gray-100">
                    <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                        <p class="text-green-600 text-xl font-bold mb-4">✅ Email verified successfully!</p>
                        <button id="login-btn" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-all">
                            Go to Login
                        </button>
                    </div>
                </div>
            `;
            document.getElementById("login-btn")?.addEventListener("click", () => {
                navigateTo("/");
            });
        } else {
            switch (response.message) {
                case 'already verified':
                    app.innerHTML = renderMessageCard("❌ Email already verified.", "text-red-600");
                    break;
                case 'expired':
                    app.innerHTML = renderMessageCard("❌ Verification failed. Link expired.", "text-red-600");
                    break;
                case 'invalid':
                    app.innerHTML = renderMessageCard("❌ Verification failed. Invalid link.", "text-red-600");
                    break;
                default:
                    app.innerHTML = renderMessageCard("❌ Verification failed. Link may be expired or invalid.", "text-red-600");
            }
        }
    } catch (error) {
        showToast("Verification error", "error");
        console.error("Verification error:", error);
        app.innerHTML = renderMessageCard("❌ An error occurred during verification.", "text-red-600");
    }
}

function renderMessageCard(message: string, colorClass: string, loading = false): string {
    return `
        <div class="flex items-center justify-center min-h-screen bg-gray-100">
            <div class="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
                <p class="${colorClass} text-lg font-medium">
                    ${loading ? '<span class="animate-spin inline-block mr-2 border-2 border-t-transparent border-blue-500 rounded-full w-5 h-5"></span>' : ''}
                    ${message}
                </p>
            </div>
        </div>
    `;
}