
import { getAccessToken, saveTokens } from "@/utils/auth";
import { AuthResponse, BasicResponse, LoginCredentials } from "../types/auth"
import { User, UserResponse } from "@/types/user";
import { TournamentData } from "@/types/tournament";
import { CreateGameResponse } from "@/types/game";
import { NotificationResponse } from "@/types/notitication";
import { Message, MessageResponse } from "@/types/message";
import { friendshipResponse } from "@/types/friendship";

const BACKEND_BASE_URL = '/api';

class ApiClient {
    
    private baseUrl: string;
    private csrfToken: string | null = null;

    constructor(baseUrl: string = BACKEND_BASE_URL) {
        this.baseUrl = baseUrl || process.env.BASEURL || '';
    }

    // Get CSRF token from server
    private async getCsrfToken(): Promise<string> {
        if (!this.csrfToken) {
            const response = await fetch(`${this.baseUrl}/csrf-token`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            this.csrfToken = data.csrfToken;
        }
        return this.csrfToken!;
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
        const url = `${this.baseUrl}/${endpoint}`
        console.log('🚀 API Request:', url, options); // 🔥 Add this
        const config: RequestInit = {
            ...options,
            credentials: 'include', // Include cookies for all requests
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            }
        }

        try {
            let response = await fetch(url, config);
            // console.log(response.headers);

            if (
                response.status === 401 &&
                endpoint !== 'auth/refresh' &&
                endpoint !== 'auth/login' &&
                endpoint !== 'auth/verify-2fa' &&
                endpoint !== 'auth/logout'
            ) {
                try {
                    const refreshRespose = await fetch(`${this.baseUrl}/auth/refresh`, {
                        method: 'POST',
                        credentials: 'include', // Include cookies for refresh token
                    });

                    if (!refreshRespose.ok)
                        throw new Error('Refresh failed');
                    const { accessToken } = await refreshRespose.json();
                    saveTokens(accessToken);
                    config.headers = {
                        ...config.headers,
                        Authorization: `Bearer ${accessToken}`,
                    };
                    response = await fetch(url, config);
                } catch (error) {
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
        return this.request<BasicResponse>(`auth/email-verification?token=${token}&id=${userId}`);
    }

    async isEmailVerified(userId: string): Promise<BasicResponse> {
        return this.request<BasicResponse>(`auth/is-email-verified?id=${userId}`);
    }

    async resendVerificationEmail(userId: string): Promise<BasicResponse> {
        return this.request<BasicResponse>(`auth/resend-verification-email?id=${userId}`);
    }

    async googleAuth(payload: object): Promise<AuthResponse> {
        return this.request<AuthResponse>('auth/google', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async readFriendList(): Promise<friendshipResponse> {
        return this.request<friendshipResponse>(`friendship/friend-list`);
    }

    async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
        const csrfToken = await this.getCsrfToken();
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            headers: {
                'X-CSRF-Token': csrfToken,
                ...options.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
        const csrfToken = await this.getCsrfToken();
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            headers: {
                'X-CSRF-Token': csrfToken,
                ...options.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const csrfToken = await this.getCsrfToken();
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': csrfToken,
                ...options.headers,
            },
        });
    }
    async verify2FALogin(tempToken: string, code: string): Promise<AuthResponse> {
        return this.post<AuthResponse>('auth/verify-2fa', { tempToken, code });
    }

    async getusergames(userId: string): Promise<any> {
        return this.get(`games/user/${userId}`);
    }

    async getGameParticipants(gameId: string): Promise<any> {
        return this.get(`games/${gameId}/participants`);
    }

    async getuserbyid(userId: string): Promise<any> {
        return this.get(`users/${userId}`);
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
        console.log("Accepting friend request with ID????????:", friendshipId);
        if (!friendshipId) {
            throw new Error("Friendship ID is required to accept a friend request.");
        }
        console.log("Sending request to accept friend request with ID:", friendshipId);
        // Ensure the endpoint matches your server's route
        console.log("Requesting endpoint: friendship/accept");
        console.log("Request body:", JSON.stringify({ friendshipId }));
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

    async getBlockedUsers(): Promise<any> {
        return this.request<any>('friendship/block-list');
    }
    async clearAllNotifications(): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>('notifications/clear-all', {
            method: 'DELETE',
        });
    }
    async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
        console.log("delete notification success,, ", notificationId);
        return this.request<{ success: boolean; message: string }>(`notifications/${notificationId}`, {
            method: 'DELETE',
            body: JSON.stringify({notificationId})
        });
    }

    async listgames(idgame?: string): Promise<CreateGameResponse> {
        const endpoint = idgame ? `games?status=${idgame}` : 'games';
        return this.request<CreateGameResponse>(`games/`);
    }
    async getgame(gameId: string): Promise<CreateGameResponse> {
        return this.request<CreateGameResponse>(`games/${gameId}`);
    }
    // tournament related
    async createTournament(tournamentName: string): Promise<{ success: boolean; message?: string, tournamentId: string }> {
        return this.request<{ success: boolean; message?: string, tournamentId: string }>('tournament', {
            method: 'POST',
            body: JSON.stringify({tournamentName: tournamentName})
        });
    }
    async getOwnedTounamentId() {
        return this.request<{ success: boolean; message?: string, tournamentId: string }>('tournament/ownedTournament');
    }
    async joinTouranement(tournamentId: string) {
        return this.request<{ success: boolean; message?: string }>(`tournament/join/${tournamentId}`, 
            {
                method: 'POST',
                body: JSON.stringify({empty: 0})
            }
        );
    }
    async getJoinedTournament() {
        return this.request<{ success: boolean; message?: string, tournamentId: string }>('tournament/joinedTournament')
    }
    async getTournament(tournamentId: string) {
        return this.request<{ success: boolean; message?: string, tournament: TournamentData }>(`tournament/${tournamentId}`);
    }
    async leaveTournament() {
        return this.request<{success: boolean; message?: string }>('tournament/leave', {
            method: 'DELETE',
            body: JSON.stringify({})
        });
    }
}

export const api = new ApiClient();







