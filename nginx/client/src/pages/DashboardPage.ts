import { isLoggedIn } from '../utils/auth';
import { navigateTo } from '../utils/router';
import { checkEmailVerification } from './LoginPage';
import { getCurrentUser } from '@/utils/authState';
import { loadingIndicator } from '@/utils/utils';
import { isEmailVerificationChecked, setEmailVerificationChecked, getCachedVerificationStatus } from '../utils/auth';
import { DashboardConfig, DashboardConfigBuilder, defaultConfig } from './dashboard/DashboardConfig';
import { DashboardManager } from './dashboard/DashboardManager';

// Main render function
export async function renderDashboard(customConfig: Partial<DashboardConfig> = {}) {
  if (!isLoggedIn()) {
    if (location.pathname !== '/login') {
      navigateTo('/login');
    }
    return;
  }

  const app = document.getElementById("app");
  if (!app) return;
  
  // Check email verification with caching
  if (!isEmailVerificationChecked()) {
    const userId = getCurrentUser()!.id!;
    
    // First check cache
    const cached = getCachedVerificationStatus(userId);
    if (cached) {
      console.log('Dashboard: Using cached verification status:', cached.verified);
      if (!cached.verified) {
        if (location.pathname !== '/check-your-email') {
          navigateTo('/check-your-email');
        }
        return;
      }
      // If verified from cache, mark as checked and continue
      setEmailVerificationChecked(true);
    } else {
      // No cache available, make API call
      app.innerHTML = loadingIndicator;
      const isVerified = await checkEmailVerification(userId);
      setEmailVerificationChecked(true);
      if (!isVerified) {
        if (location.pathname !== '/check-your-email') {
          navigateTo('/check-your-email');
        }
        return;
      }
    }
  }

  // Merge configurations and initialize dashboard
  const config = { ...defaultConfig, ...customConfig };
  const dashboard = new DashboardManager(config);
  await dashboard.initialize();
}

// Export the configuration builder for external use
export { DashboardConfigBuilder };

// Export types for external use
export type { DashboardConfig };