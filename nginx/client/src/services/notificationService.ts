import { api } from './api';
import { getCurrentUser } from '../utils/authState';

// Types and Interfaces
interface NotificationData {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    sentAt: string;
    senderName: string;
}

interface FriendRequest {
    id: string;
    senderId: string;
    senderName: string;
    senderPicture?: string;
    createdAt: string;
}

// Global notification state
let notificationCounts: { [friendId: string]: number } = {};
let totalNotifications = 0;
let notificationSound: HTMLAudioElement | null = null;

/**
 * Notification Service Class
 */
export class NotificationService {
    private static instance: NotificationService;
    private globalFriendUsers: any[] = [];

    constructor() {
        this.initializeNotificationSound();
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    // Getters and Setters
    setGlobalFriendUsers(friends: any[]) {
        this.globalFriendUsers = friends;
    }

    getNotificationCounts() {
        return notificationCounts;
    }

    getTotalNotifications() {
        return totalNotifications;
    }

    /**
     * Initializes notification sound with volume control
     */
    initializeNotificationSound() {
        try {
            notificationSound = new Audio('notification.mp3');
            notificationSound.volume = 0.3;
        } catch (error) {
            console.log('⚠️ Notification sound not available');
        }
    }

    /**
     * Enhanced notification permission request with user-friendly messaging
     */
    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            this.showModalNotification('info', 'Enable notifications to never miss a message!');

            setTimeout(() => {
                Notification.requestPermission().then(permission => {

                    if (permission === 'granted') {
                        this.showModalNotification('success', 'Great! You\'ll now receive desktop notifications.');
                        setTimeout(() => {
                            new Notification('🎉 Notifications Enabled!', {
                                body: 'You\'ll now be notified of new messages.',
                                icon: '/favicon.ico'
                            });
                        }, 1000);
                    } else if (permission === 'denied') {
                        this.showModalNotification('warning', 'Notifications blocked. You can enable them in your browser settings.');
                    }
                });
            }, 2000);
        }
    }

    /**
     * Adds a notification for unread messages from a specific friend
     */
    addNotification(friendId: string, messageData: NotificationData) {
        notificationCounts[friendId] = (notificationCounts[friendId] || 0) + 1;
        totalNotifications++;

        // Play notification sound
        this.playNotificationSound();

        // Add visual effects
        this.addVisualEffects();

        // Flash browser tab
        this.flashBrowserTab();

        // Show browser notification
        this.showBrowserNotification(messageData);

        // Update friend list notification
        this.updateFriendListNotification(friendId);

        // Update all UI notification indicators
        this.updateNotificationUI();

    }

    /**
     * Plays notification sound with fallback
     */
    playNotificationSound() {
        if (notificationSound) {
            notificationSound.play()
                .then(() => console.log('🔊 Notification sound played'))
                .catch(error => {
                    console.log('Could not play notification sound:', error);
                    this.createBeepSound();
                });
        }
    }

    /**
     * Creates a fallback beep sound using Web Audio API
     */
    createBeepSound() {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not create beep sound:', error);
        }
    }

    /**
     * Adds visual effects to notification elements
     */
    addVisualEffects() {
        const notificationButton = document.getElementById('notification-toggle-sidebar');
        if (notificationButton) {
            notificationButton.classList.add('notification-bounce', 'notification-pulse');

            const usersBox = document.getElementById('users-box');
            if (usersBox) {
                usersBox.classList.add('notification-shake');
                setTimeout(() => {
                    usersBox.classList.remove('notification-shake');
                }, 500);
            }

            setTimeout(() => {
                notificationButton.classList.remove('notification-bounce');
            }, 600);
        }
    }

    /**
     * Flashes the browser tab title to get user attention
     */
    flashBrowserTab() {
        let flashCount = 0;
        const maxFlashes = 6;
        const originalTitle = document.title;

        const flashInterval = setInterval(() => {
            if (flashCount >= maxFlashes) {
                clearInterval(flashInterval);
                document.title = totalNotifications > 0 ? `(${totalNotifications}) Chat App` : 'Chat App';
                return;
            }

            document.title = flashCount % 2 === 0 ? '🔔 NEW MESSAGE!' : originalTitle;
            flashCount++;
        }, 800);
    }

    /**
     * Shows enhanced browser notification
     */
    showBrowserNotification(messageData: NotificationData) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(`💬 ${messageData.senderName}`, {
                body: messageData.content.length > 50 ?
                    messageData.content.substring(0, 50) + '...' :
                    messageData.content,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: messageData.senderId,
                requireInteraction: true
            });

            setTimeout(() => {
                notification.close();
            }, 10000);

            notification.onclick = () => {
                window.focus();
                // Emit custom event for main app to handle
                window.dispatchEvent(new CustomEvent('selectFriend', {
                    detail: { friendId: messageData.senderId }
                }));
                notification.close();
            };
        }
    }

    /**
     * Updates the visual notification indicator on friend list item
     */
    updateFriendListNotification(friendId: string) {
        const friendItem = document.querySelector(`[data-friend-id="${friendId}"]`);
        if (friendItem) {
            friendItem.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
            friendItem.classList.add('notification-pulse');
            setTimeout(() => {
                friendItem.classList.remove('notification-pulse');
            }, 2000);
        }
    }

    /**
     * Updates UI elements to reflect current notification state
     */
    updateNotificationUI() {
        document.title = totalNotifications > 0 ? `(${totalNotifications}) Chat App` : 'Chat App';
        this.updateSidebarNotificationBadge();
    }

    /**
     * Updates the notification badge in the sidebar
     */
    updateSidebarNotificationBadge() {
        const notificationToggle = document.getElementById('notification-toggle-sidebar');
        if (!notificationToggle) return;

        const existingBadge = notificationToggle.querySelector('.animate-bounce');
        if (existingBadge) {
            existingBadge.remove();
        }

        if (totalNotifications > 0) {
            const badge = document.createElement('div');
            badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce';
            badge.textContent = totalNotifications > 99 ? '99+' : totalNotifications.toString();
            notificationToggle.appendChild(badge);
            console.log("notification-toggle-sidebar", notificationToggle);
        }
    }

    /**
     * Shows friend request alert modal
     */
    showFriendRequestAlert(request: FriendRequest) {
        const existingAlert = document.getElementById('friend-request-alert');
        if (existingAlert) existingAlert.remove();

        const modal = document.createElement('div');
        modal.id = 'friend-request-alert';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';

        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-bounce">
                <div class="text-center">
                    <div class="mb-4">
                        <img src="${request.senderPicture || 'user-avatar.png'}" 
                             alt="${request.senderName}" 
                             class="w-20 h-20 rounded-full mx-auto border-4 border-blue-500 shadow-lg">
                    </div>
                    
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">🤝 Friend Request!</h3>
                    <p class="text-gray-600 mb-6 text-lg">
                        <strong class="text-blue-600">${request.senderName}</strong> wants to be your friend!
                    </p>
                    
                    <div class="flex space-x-3 mb-4">
                        <button id="accept-request" 
                                class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-semibold">
                            ✓ Accept
                        </button>
                        <button id="reject-request" 
                                class="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition duration-200 font-semibold">
                            ✗ Reject
                        </button>
                    </div>
                    
                    <button id="close-alert" 
                            class="text-gray-500 hover:text-gray-700 text-sm underline">
                        Decide Later
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('accept-request')?.addEventListener('click', async () => {
            await this.handleFriendRequestResponse(request.id, 'accept', request.senderName);
            modal.remove();
        });

        document.getElementById('reject-request')?.addEventListener('click', async () => {
            await this.handleFriendRequestResponse(request.id, 'reject', request.senderName);
            modal.remove();
        });

        document.getElementById('close-alert')?.addEventListener('click', () => {
            modal.remove();
        });

        setTimeout(() => {
            if (document.getElementById('friend-request-alert')) {
                modal.remove();
            }
        }, 30000);
    }

    /**
     * Handles friend request response
     */
    async handleFriendRequestResponse(requestId: string, action: 'accept' | 'reject', senderName: string) {
        try {
            let response;

            if (action === 'accept') {
                response = await api.acceptFriendRequest(requestId);
                if (response.success) {
                    this.showModalNotification('success', `✅ You are now friends with ${senderName}! 🎉`);
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } else {
                response = await api.rejectFriendRequest(requestId);
                if (response.success) {
                    this.showModalNotification('info', `Friend request from ${senderName} declined.`);
                }
            }

            if (!response.success) {
                this.showModalNotification('error', response.message || 'Failed to process friend request.');
            }
        } catch (error) {
            console.error('Error handling friend request:', error);
            this.showModalNotification('error', 'Network error. Please try again.');
        }
    }

    /**
     * Clears notifications for a specific friend
     */
    clearNotificationsForFriend(friendId: string) {
        if (notificationCounts[friendId]) {
            totalNotifications -= notificationCounts[friendId];
            notificationCounts[friendId] = 0;
            this.updateNotificationUI();
        }
    }

    /**
     * Clears all notifications
     */
    clearAllNotifications() {
        notificationCounts = {};
        totalNotifications = 0;
        this.updateNotificationUI();
    }

    /**
     * Shows modal notification with styling
     */
    showModalNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
        // Create a temporary notification if modal elements don't exist
        const tempNotification = document.createElement('div');
        tempNotification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-[200] transition-all duration-300`;

        let bgColor, textColor, icon;
        switch (type) {
            case 'success':
                bgColor = 'bg-green-100 border border-green-400';
                textColor = 'text-green-800';
                icon = '✅';
                break;
            case 'error':
                bgColor = 'bg-red-100 border border-red-400';
                textColor = 'text-red-800';
                icon = '❌';
                break;
            case 'warning':
                bgColor = 'bg-yellow-100 border border-yellow-400';
                textColor = 'text-yellow-800';
                icon = '⚠️';
                break;
            case 'info':
            default:
                bgColor = 'bg-blue-100 border border-blue-400';
                textColor = 'text-blue-800';
                icon = 'ℹ️';
                break;
        }

        tempNotification.className += ` ${bgColor} ${textColor}`;
        tempNotification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${icon}</span>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;

        document.body.appendChild(tempNotification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            tempNotification.remove();
        }, 5000);
    }

    /**
     * Generates HTML for notification list from API response
     */
    async generateNotificationListFromAPI(notifications: any[]): Promise<string> {
        const currentUser = getCurrentUser();
        if (!currentUser) return '';

        // Debug: Log the notification structure

        const notificationItems = await Promise.all(
            notifications.map(async (notification) => {
                let senderName = 'Unknown';
                let senderPicture = '';

                // Try different possible property names for senderId
                const senderId = notification.senderID ||
                    notification.senderId ||
                    notification.sender_id ||
                    notification.fromUserId ||
                    notification.from_user_id ||
                    notification.userId;

                try {
                    if (senderId && senderId !== 'undefined') {
                        const senderResponse = await api.getuserbyid(senderId);
                        if (senderResponse.success && senderResponse.user) {
                            senderName = senderResponse.user.fullName || 'Unknown';
                            senderPicture = senderResponse.user.picture || '';
                        }
                    } else {
                        console.warn('⚠️ No valid senderId found for notification:', notification);
                    }
                } catch (error) {
                    console.error('Error fetching sender info:', error);
                }

                const timeAgo = this.getTimeAgo(new Date(notification.createdAt));

                return `
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200 border-b border-gray-100" 
                     data-notification-id="${notification.id}" 
                     data-sender-id="${senderId || ''}">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${senderPicture || '/assets/user-avatar.png'}" 
                                 alt="${senderName}" 
                                 class="w-8 h-8 rounded-full object-cover"
                                 onerror="this.src='/assets/default-avatar.png'">
                            <div class="absolute -top-1 -right-1 w-3 h-3 ${notification.isRead ? 'bg-gray-400' : 'bg-red-500'} border border-white rounded-full"></div>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">${senderName}</p>
                            <p class="text-xs text-gray-600 max-w-[220px] break-words">${notification.content || notification.message || 'New notification'}</p>
                            <div class="flex items-center text-xs text-gray-500 mt-1">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                                </svg>
                                ${timeAgo}
                                <span class="mx-1">•</span>
                                <span class="capitalize ${notification.isRead ? 'text-gray-400' : 'text-blue-600 font-medium'}">${notification.type || 'Message'}</span>
                                ${!notification.isRead ? '<span class="ml-1 text-blue-600">•</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center">
                        ${!notification.isRead ? `<div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>` : ''}
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                </div>
            `;
            })
        );

        return notificationItems.join('');
    }
    /**
     * Calculates and formats time ago from a given date
     */
    getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        else if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        else if (diffInHours < 24) return `${diffInHours}h ago`;
        else if (diffInDays < 7) return `${diffInDays}d ago`;
        else return date.toLocaleDateString();
    }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();