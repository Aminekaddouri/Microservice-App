import { User } from "./user";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    message?: string;
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