export interface User {
    id: string;
    fullName: string;
    nickName: string;
    email: string;
    password?: string;
    picture: string;
    verified?: boolean;
    joinedAt?: string;
}

export type UserResponse = {
    success: boolean;
    user?: User;
    message?: string;
    users?: User[];
}