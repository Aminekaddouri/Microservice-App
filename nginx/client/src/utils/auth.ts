import { api } from "@/services/api";
import { clearCurrentUser, setCurrentUser } from "./authState";

const ACCESS_TOKEN = 'access_token'
const EMAIL_VERIFICATION_CHECKED = 'email_verification_checked'
const EMAIL_VERIFICATION_CACHE = 'email_verification_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

interface VerificationCache {
    userId: string;
    verified: boolean;
    timestamp: number;
}

export function saveTokens(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
}

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN);
}

// Refresh token is now handled via HTTP-only cookies
// No need to access it from localStorage

export function isLoggedIn(): boolean {
    return !!getAccessToken();
}

export async function logout() {
  try {
    await api.post('auth/logout', {});
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem('user');
    localStorage.removeItem(EMAIL_VERIFICATION_CHECKED);
    localStorage.removeItem(EMAIL_VERIFICATION_CACHE);
    clearCurrentUser();
  }
}

export function setEmailVerificationChecked(checked: boolean) {
    if (checked) {
        localStorage.setItem(EMAIL_VERIFICATION_CHECKED, 'true');
    } else {
        localStorage.removeItem(EMAIL_VERIFICATION_CHECKED);
    }
}

export function isEmailVerificationChecked(): boolean {
    return localStorage.getItem(EMAIL_VERIFICATION_CHECKED) === 'true';
}

// Email verification cache functions
export function getCachedVerificationStatus(userId: string): { verified: boolean; fromCache: boolean } | null {
    try {
        const cached = localStorage.getItem(EMAIL_VERIFICATION_CACHE);
        if (!cached) return null;
        
        const cacheData: VerificationCache = JSON.parse(cached);
        
        // Check if cache is for the same user and still valid
        if (cacheData.userId === userId && 
            Date.now() - cacheData.timestamp < CACHE_DURATION) {
            return { verified: cacheData.verified, fromCache: true };
        }
        
        // Cache expired or different user, remove it
        localStorage.removeItem(EMAIL_VERIFICATION_CACHE);
        return null;
    } catch (error) {
        console.error('Error reading verification cache:', error);
        localStorage.removeItem(EMAIL_VERIFICATION_CACHE);
        return null;
    }
}

export function setCachedVerificationStatus(userId: string, verified: boolean): void {
    try {
        const cacheData: VerificationCache = {
            userId,
            verified,
            timestamp: Date.now()
        };
        localStorage.setItem(EMAIL_VERIFICATION_CACHE, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error setting verification cache:', error);
    }
}

export function invalidateVerificationCache(): void {
    localStorage.removeItem(EMAIL_VERIFICATION_CACHE);
}

export function isCacheValid(userId: string): boolean {
    const cached = getCachedVerificationStatus(userId);
    return cached !== null;
}

export async function verifyToken(): Promise<boolean> {
    try {
        const response = await api.verifyToken();
        if (response && response.success && response.user) {
            setCurrentUser(response.user);
            try { localStorage.setItem('user', JSON.stringify(response.user)); } catch {}
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}