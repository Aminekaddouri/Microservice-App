
import { getAccessToken, getRefreshToken, logout, saveTokens } from "@/utils/auth";
import { AuthResponse, BasicResponse, LoginCredentials } from "../types/auth"
import { User, UserResponse } from "@/types/user";
import { friendshipResponse } from "@/types/friendship";
import { ConversationMessagesResponse, Message, MessageResponse } from "@/types/message";
import { NotificationResponse } from "@/types/notitication";




const BACKEND_BASE_URL = '/api/';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = BACKEND_BASE_URL) {
        this.baseUrl = baseUrl || process.env.BASEURL || '';
    }

    private getAuthHeaders(): Record<string, string> {
        const token = getAccessToken();
        const headers: Record<string, string> = {
            'content-type': 'application/json',
        }
        if (token)
            headers.Authorization = `Bearer ${token}`;
        return headers;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const config: RequestInit = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            }
        }

        try {
            let response = await fetch(url, config);
            if (response.status === 401 && endpoint !== 'auth/refresh' && endpoint !== 'auth/login') {
                try {
                    const refreshToken = getRefreshToken();
                    if (!refreshToken)
                        throw new Error('RefreshToken invalid');
                    const refreshRespose = await fetch(`${this.baseUrl}auth/refresh`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken }),
                    });

                    if (!refreshRespose.ok)
                        throw new Error('Refresh failed');
                    const { accessToken, message } = await refreshRespose.json();
                    saveTokens(accessToken, refreshToken);
                    config.headers = {
                        ...config.headers,
                        Authorization: `Bearer ${accessToken}`,
                    };
                    response = await fetch(endpoint, config);
                } catch (error) {
                    logout();
                    console.log(error);
                    throw new Error('Session expired');
                }
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw Error(`Invalid response format: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP error: ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        return this.request<AuthResponse>('auth/login',
            {
                method: 'POST',
                body: JSON.stringify(credentials),
            },
        );
    }

    async signup(user: User): Promise<BasicResponse> {
        return this.request<BasicResponse>('auth/register',
            {
                method: 'POST',
                body: JSON.stringify(user),
            }
        );
    }

    async verifyToken(): Promise<AuthResponse> {
        return this.request<AuthResponse>('auth/verify');
    }

    async verifyEmail(token: string, userId: string): Promise<BasicResponse> {
        return this.request<BasicResponse>(`auth/verify-email?token=${token}&id=${userId}`);
    }

    async isEmailVerified(userId: string): Promise<BasicResponse> {
        return this.request<BasicResponse>(`auth/is-email-verified?id=${userId}`);
    }

    async resendVerificationEmail(userId: string): Promise<BasicResponse> {
        return this.request<BasicResponse>(`auth/resend-verification-email?id=${userId}`);
    }

    async googleAuth(token: string) {
        return this.request<AuthResponse>('auth/google/callback',
            {
                method: 'POST',
                body: JSON.stringify({ token }),
            }
        );
    }

    async readFriendList(): Promise<friendshipResponse> {
        return this.request<friendshipResponse>(`friendship/friend-list`);
    }

    async sendMessage(message: Message): Promise<MessageResponse> {
        return this.request<MessageResponse>(`messages/`,
            {
                method: 'POST',
                body: JSON.stringify(message)
            }
        );
    }

    async getConversationMessages(userId: string, friendId: string): Promise<Message[]> {
        return this.request<Message[]>(`messages/${userId}/conv/${friendId}`);
    }///:id/conv/:friendId

    async getuserbyid(userId: string): Promise<UserResponse> {
        return this.request<UserResponse>(`users/${userId}`);
    }

    async getAllUsers(): Promise<UserResponse> {
        return this.request<UserResponse>('users/');
    }

    async addFriend(friendId: string): Promise<any> {
        return this.request<any>('friendship/add-friend', {
            method: 'POST',
            body: JSON.stringify({ targetUserId: friendId })
        });
    }
    // Add this method to your ApiClient class
    async markMessageAsRead(messageId: string): Promise<{ success: boolean; message?: string }> {
        return this.request<{ success: boolean; message?: string }>(`messages/${messageId}`, {
            method: 'PATCH',
            body: JSON.stringify(messageId)
        });
    }
    async getNotifications(): Promise<NotificationResponse> {
        return this.request<NotificationResponse>('notifications/me');
    }
    async sendNotification(content: string, type: string, receiversIds: string[]): Promise<NotificationResponse> {
        return this.request<NotificationResponse>('notifications/', {
            method: 'POST',
            body: JSON.stringify({ content, type, receiversIds })
        });
    }
    async acceptFriendRequest(friendshipId: string): Promise<NotificationResponse> {
        return this.request<NotificationResponse>('friendship/accept', {
            method: 'POST',
            body: JSON.stringify({ friendshipId })
        });
    }

    async rejectFriendRequest(friendshipId: string): Promise<NotificationResponse> {
        return this.request<NotificationResponse>('friendship/reject', {
            method: 'POST',
            body: JSON.stringify({ friendshipId })
        });
    }

    async getPendingFriendRequests(): Promise<NotificationResponse> {
        console.log("SDsuccess: ");
        return this.request<NotificationResponse>('friendship/pending-requests');
    }

    // Add this method to your ApiClient class
    async getPendingRequests(): Promise<{
        requests: any; success: boolean; pendingRequests: NotificationResponse[]
    }> {
        return this.request<{ requests: any; success: boolean; pendingRequests: NotificationResponse[] }>('friendship/pending-requests');
    }


    async clearConversation(userId: string, friendId: string): Promise<{ success: boolean; message: string; deletedCount?: number }> {
        // Fix: Remove leading slash to prevent double slash
        return this.request<{ success: boolean; message: string; deletedCount?: number }>(`messages/${userId}/conv/${friendId}/clear`, {
            method: 'DELETE',
            body: JSON.stringify({ friendId })
        });
    }

    async clearConversationForUser(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
        // Fix: Remove leading slash to prevent double slash
        return this.request<{ success: boolean; message: string }>(`messages/${userId}/conv/${friendId}/clear-for-user`, {
            method: 'DELETE',
            body: JSON.stringify({ friendId })
        });
    }
    async bockfrienduser(friendId: string): Promise<any>
    {
        return this.request<any>('friendship/block-friend',{
            method: 'POST',
            body:JSON.stringify({targetUserId: friendId})
        });
    }
    async clearAllNotifications(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('notifications/clear-all', {
        method: 'DELETE',
        body:JSON.stringify('')
    });
}
}

export const api = new ApiClient();







