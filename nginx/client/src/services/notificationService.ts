import { api } from './api';
import { getCurrentUser } from '../utils/authState';
import { i18n } from './i18n';

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
     * Updates the notification badge in the sidebar with modern design
     */
    updateSidebarNotificationBadge() {
        const notificationToggle = document.getElementById('notification-toggle-sidebar');
        if (!notificationToggle) return;

        // Remove existing badges
        const existingBadges = notificationToggle.querySelectorAll('.notification-badge, .animate-bounce');
        existingBadges.forEach(badge => badge.remove());

        if (totalNotifications > 0) {
            const badge = document.createElement('div');
            badge.className = 'notification-badge absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full shadow-lg transform transition-all duration-300 animate-pulse';
            
            // Enhanced gradient background based on notification count
            if (totalNotifications >= 10) {
                badge.classList.add('bg-gradient-to-r', 'from-red-500', 'to-pink-500', 'animate-bounce');
            } else if (totalNotifications >= 5) {
                badge.classList.add('bg-gradient-to-r', 'from-orange-500', 'to-red-500');
            } else {
                badge.classList.add('bg-gradient-to-r', 'from-orange-400', 'to-orange-600');
            }
            
            // Add glow effect for high priority notifications
            if (totalNotifications >= 5) {
                badge.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6), 0 0 24px rgba(239, 68, 68, 0.3)';
            }
            
            badge.textContent = totalNotifications > 99 ? '99+' : totalNotifications.toString();
            
            // Add entrance animation
            badge.style.transform = 'scale(0)';
            notificationToggle.appendChild(badge);
            
            // Trigger entrance animation
            requestAnimationFrame(() => {
                badge.style.transform = 'scale(1)';
            });
            
            console.log("Enhanced notification badge updated:", notificationToggle);
        }
    }

    /**
     * Shows enhanced friend request alert modal with modern design
     */
    showFriendRequestAlert(request: FriendRequest, notificationId: string) {
        const existingAlert = document.getElementById('friend-request-alert');
        if (existingAlert) existingAlert.remove();

        const modal = document.createElement('div');
        modal.id = 'friend-request-alert';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300';

        modal.innerHTML = `
            <div class="relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/30 transform transition-all duration-300 scale-95 hover:scale-100">
                <!-- Gradient overlay for glass effect -->
                <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10 rounded-3xl pointer-events-none"></div>
                
                <div class="relative text-center">
                    <!-- Enhanced profile image section -->
                    <div class="mb-6">
                        <div class="relative inline-block">
                            <div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                            <img src="${request.senderPicture || 'user-avatar.png'}" 
                                 alt="${request.senderName}" 
                                 class="relative w-24 h-24 rounded-full mx-auto border-4 border-white/50 shadow-xl object-cover"
                                 onerror="this.src='/default-avatar.png'">
                            <!-- Friend request icon -->
                            <div class="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-full border-2 border-white shadow-lg">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Enhanced header -->
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">🤝 Friend Request!</h3>
                        <p class="text-gray-600 text-lg leading-relaxed">
                            <strong class="text-orange-600 font-semibold">${request.senderName}</strong> wants to connect with you!
                        </p>
                        <div class="mt-2 inline-flex items-center px-3 py-1 bg-orange-100/50 rounded-full">
                            <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span class="text-xs font-medium text-gray-600">New Request</span>
                        </div>
                    </div>
                    
                    <!-- Enhanced action buttons -->
                    <div class="flex space-x-3 mb-6">
                        <button id="accept-request" 
                                class="group flex-1 relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 px-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50">
                            <span class="relative z-10 flex items-center justify-center space-x-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span>${i18n.t('chat.accept')}</span>
                            </span>
                            <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                        </button>
                        <button id="reject-request" 
                                class="group flex-1 relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3.5 px-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50">
                            <span class="relative z-10 flex items-center justify-center space-x-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                                <span>${i18n.t('chat.decline')}</span>
                            </span>
                            <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                        </button>
                    </div>
                    
                    <!-- Enhanced decide later button -->
                    <button id="close-alert" 
                            class="group text-gray-500 hover:text-gray-700 text-sm font-medium transition-all duration-200 hover:bg-gray-100/50 px-4 py-2 rounded-xl">
                        <span class="flex items-center space-x-1">
                            <svg class="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>Decide Later</span>
                        </span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('accept-request')?.addEventListener('click', async () => {
            await this.handleFriendRequestResponse(request.id, 'accept', request.senderName, notificationId);
            modal.remove();
        });

        document.getElementById('reject-request')?.addEventListener('click', async () => {
            await this.handleFriendRequestResponse(request.id, 'reject', request.senderName, notificationId);
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
    async handleFriendRequestResponse(requestId: string, action: 'accept' | 'reject', senderName: string, notificationId: string) {
        try {
            let response;

            if (action === 'accept') {
                console.log("Accepting friend request with ID:", requestId);
                if (!requestId) {
                    throw new Error("Friendship ID is required to accept a friend request.");
                }
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
            try {
                console.log("######################################, ",notificationId);
                await api.deleteNotification(notificationId);
            } catch (error) {
                console.error('Error clearing notifications:', error);
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
     * Shows enhanced modal notification with modern design
     */
    showModalNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
        // Create enhanced notification with modern styling
        const tempNotification = document.createElement('div');
        tempNotification.className = `fixed top-6 right-6 max-w-sm w-full p-4 rounded-2xl shadow-2xl z-[200] transition-all duration-500 transform backdrop-blur-xl border border-white/20`;

        let bgGradient, textColor, iconSvg, glowEffect;
        switch (type) {
            case 'success':
                bgGradient = 'bg-gradient-to-r from-green-500/90 to-emerald-600/90';
                textColor = 'text-white';
                glowEffect = '0 0 20px rgba(34, 197, 94, 0.4)';
                iconSvg = `
                    <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                `;
                break;
            case 'error':
                bgGradient = 'bg-gradient-to-r from-red-500/90 to-pink-600/90';
                textColor = 'text-white';
                glowEffect = '0 0 20px rgba(239, 68, 68, 0.4)';
                iconSvg = `
                    <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                `;
                break;
            case 'warning':
                bgGradient = 'bg-gradient-to-r from-yellow-500/90 to-orange-600/90';
                textColor = 'text-white';
                glowEffect = '0 0 20px rgba(245, 158, 11, 0.4)';
                iconSvg = `
                    <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                `;
                break;
            case 'info':
            default:
                bgGradient = 'bg-gradient-to-r from-blue-500/90 to-indigo-600/90';
                textColor = 'text-white';
                glowEffect = '0 0 20px rgba(59, 130, 246, 0.4)';
                iconSvg = `
                    <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                `;
                break;
        }

        tempNotification.className += ` ${bgGradient} ${textColor}`;
        tempNotification.style.boxShadow = glowEffect;
        
        tempNotification.innerHTML = `
            <div class="flex items-start space-x-3">
                ${iconSvg}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold leading-relaxed">${message}</p>
                </div>
                <button class="notification-close flex-shrink-0 text-white/70 hover:text-white transition-colors duration-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;

        // Add entrance animation
        tempNotification.style.transform = 'translateX(100%) scale(0.8)';
        tempNotification.style.opacity = '0';
        
        document.body.appendChild(tempNotification);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            tempNotification.style.transform = 'translateX(0) scale(1)';
            tempNotification.style.opacity = '1';
        });
        
        // Add close button functionality
        const closeBtn = tempNotification.querySelector('.notification-close');
        closeBtn?.addEventListener('click', () => {
            tempNotification.style.transform = 'translateX(100%) scale(0.8)';
            tempNotification.style.opacity = '0';
            setTimeout(() => tempNotification.remove(), 300);
        });

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