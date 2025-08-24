import { api } from "@/services/api";
import { clearCurrentUser } from "./authState";

const ACCESS_TOKEN = 'access_token'
const REFRESH_TOKEN = 'refresh_token'

export function saveTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
}

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN);
}

export function isLoggedIn(): boolean {
    return !!getAccessToken();
}

export function logout() {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem('user');
    clearCurrentUser();
}

export async function verifyToken(): Promise<boolean> {
    try {
        const response = await api.verifyToken();
        if (response && response.success && response.user)
            return true;
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}