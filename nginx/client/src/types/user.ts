export interface User {
    id?: string;
    fullName: string;
    nickName: string;
    email: string;
    password?: string;
    picture: string;
    verified?: boolean;
    joinedAt?: string;
    isGoogleUser?: boolean;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string;
}

export type UserResponse = {
    id(id: any): unknown;
    success: boolean;
    user?: User;
    message?: string;
    users?: User[];
}