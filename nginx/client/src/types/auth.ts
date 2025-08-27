import { User } from "./user";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    accessToken?: string;
    // refreshToken is now handled via HTTP-only cookies
    user?: User;
    pending2fa?: boolean;
    tempToken?: string;
}

export interface BasicResponse{
    success: boolean;
    verified?: boolean;
    message?: string;
}

export interface AuthToken {
    userId: string;
    expiresAt?: string;
    iat?: number;
    exp?: number;
}