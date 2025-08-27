import { logout, isLoggedIn, getAccessToken, verifyToken } from '../utils/auth';
import { navigateTo } from '../utils/router';
import io from 'socket.io-client';
import { api } from '@/services/api';
import { getCurrentUser } from '@/utils/authState';
import { Message } from "@/types/message";
import { notificationService } from '../services/notificationService';
import { Game, GameParticipant } from '@/types/game';
import { socketNotification } from '@/utils/notification';
import { ChatPageManager } from '../components/chat/ChatPageManager';
import { i18n } from '@/services/i18n';
import { online } from '@/game-tools/online-game-tools';


interface ClientUserMap {
    [socketId: string]: string;
}


interface UserInfo {
    id: string;
    name: string;
    fullName?: string;
    email?: string;
    picture?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen?: Date;
    isTyping?: boolean;
    socketId?: string;
}


interface MessageData {
    name: string;
    message: string;
    dateTime: Date;
}

let messageContainer: HTMLElement;
let notificationId: string | null = null;
let onlineUsers: string[] = [];
let messageInput: HTMLTextAreaElement;
let app: HTMLElement;
let friends: any[] = [];
let notificationCounts: { [friendId: string]: number } = {};
export let totalNotifications = 0;
let notificationSound: HTMLAudioElement | null = null;
let receiverSocketId: string | null = null;
let selectedFriend: any = null;
export let globalFriendUsers: any[] = [];
let isSocketSetup = false;
let isEventsSetup = false;
let isSending = false;
let chatPageManager: ChatPageManager | null = null;

let socket = io('http://localhost', { //*********************//
    auth: {
        token: getAccessToken()
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});


export async function initChat() {
    if (!isLoggedIn()) {
        navigateTo('/');
        return;
    }
    renderChat();
}

function startOnlineStatusRefresh() {
    setInterval(() => {
        if (socketNotification?.connected) {
            console.log('🔄 Requesting updated online users list...');
            socketNotification?.emit('get-online-users');
        }
    }, 10000);
}


async function renderChat() {
    app = document.getElementById("app") as HTMLElement;
    if (!app) {
        console.error('App element not found');
        return;
    }

    if (socket.connected) {
        socket.disconnect();
    }
    isEventsSetup = false;
    isSocketSetup = false;

    let friends: any[] = [];
    try {
        const response = await api.readFriendList();
        if (!response.success) {
            console.log('error');
            return;
        }
        friends = response.friendship || [];
    } catch (error) {
        console.log('error: ', error);
    }


    app.innerHTML = `
    <!-- Main Chat Container with Glass Morphism Design -->
    <main class="w-full h-full flex items-stretch justify-center overflow-hidden">
      <section class="relative w-full h-full bg-transparent flex flex-col overflow-hidden">
        
        <!-- Chat Content Container -->
        <div class="relative z-10 w-full h-full flex flex-col overflow-hidden">
          <!-- Beautiful Glass Container -->
          <div class="relative bg-transparent border-none rounded-xl shadow-none h-full flex flex-col overflow-hidden">
            <!-- Gradient overlay for extra depth -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
            
            <!-- Inner glow effect -->
            <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
            
            <!-- Header -->
            <header class="relative z-10 flex items-center justify-between p-4 md:p-6 border-b border-white/20">
              <div class="flex items-center gap-2 md:gap-3">
                <div class="w-3 h-3 md:w-4 md:h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <h1 class="font-semibold text-white text-xl md:text-2xl lg:text-3xl drop-shadow-lg">
                  <span class="hidden sm:inline">${i18n.t('chat.chatRoom')}</span>
                  <span class="sm:hidden">Chat</span>
                </h1>
              </div>
            </header>

            <!-- Main Chat Layout -->
            <div id="chat_area" class="relative z-10 flex flex-1 h-full overflow-hidden">
              <!-- Mobile Toggle Button for Sidebar -->
              <button 
                id="mobile-sidebar-toggle"
                class="fixed top-4 left-4 z-50 md:hidden bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-3 text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
                aria-label="Toggle friends list"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <!-- Mobile Overlay -->
              <div id="mobile-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden hidden transition-opacity duration-300"></div>

              <!-- Users Sidebar -->
              <aside 
                id="users-box" 
                class="
                  fixed md:relative 
                  top-0 left-0 
                  h-full md:h-auto 
                  w-80 sm:w-96 md:w-80 lg:w-96 xl:w-80 2xl:w-96
                  transform -translate-x-full md:translate-x-0 
                  transition-transform duration-300 ease-in-out 
                  z-50 md:z-auto
                  border-r border-white/20 
                  bg-white/10 md:bg-white/5 
                  backdrop-blur-lg md:backdrop-blur-sm 
                  flex flex-col
                  shadow-2xl md:shadow-none
                "
              >
                <!-- Sidebar Header -->
                <div class="p-4 md:p-4 lg:p-6 border-b border-white/20 flex items-center justify-between">
                  <h2 class="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                    <svg class="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span class="hidden sm:inline">${i18n.t('chat.friends')}</span>
                  </h2>
                  
                  <!-- Close button for mobile -->
                  <button 
                    id="mobile-sidebar-close"
                    class="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                    aria-label="Close friends list"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <!-- User List -->
                <div id="user-list" class="user-list flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
                  <!-- Dynamically filled -->
                  <div class="text-center text-white/60 text-sm pt-8">
                    <svg class="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p class="text-xs md:text-sm">${i18n.t('chat.noFriendsOnline')}</p>
                  </div>
                </div>
              </aside>

              <!-- Chat Area - Will be managed by ChatPageManager -->
              <main 
                id="chat-page-container" 
                class="
                  flex-1 
                  flex flex-col 
                  min-w-0
                  h-full
                  overflow-hidden
                  transition-all duration-300
                "
              >
                <!-- This will be populated by ChatPageManager -->
              </main>
            </div>
          </div>
        </div>
      </section>
    </main>
    `;


    const currentUser = getCurrentUser()!;
    const userList = document.getElementById('user-list');
    if (userList && friends.length > 0) {
        const friendUserPromises = friends.map(async friend => {
            const friendId = friend.user1ID === currentUser.id ? friend.user2ID : friend.user1ID;
            try {
                const response = await api.getuserbyid(friendId);
                return response.user;
            } catch (error) {
                console.error('Error fetching user data:', error);
                return { id: friendId, fullName: 'Unknown1', picture: '' };
            }
        });
        const friendUsers = await Promise.all(friendUserPromises);
        globalFriendUsers = friendUsers;
        notificationService.initializeNotificationSound();
        notificationService.requestNotificationPermission();
        notificationService.setGlobalFriendUsers(friendUsers);
        userList.innerHTML = friendUsers.map(friendUser => {
            const unreadCount = notificationCounts[friendUser?.id] || 0;
            const isOnline = getOnlineStatus(friendUser?.id);

            return `
        <button
            type="button"
            class="user-item group relative backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-2xl p-4 w-full text-left cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${unreadCount > 0 ? 'ring-2 ring-blue-400/50 bg-blue-500/20 border-blue-400/40' : ''}"
            data-friend-id="${friendUser?.id}"
            role="button"
            tabindex="0"
            aria-label="Chat with ${friendUser?.fullName || 'Unknown'}"
        >
            <div class="flex items-center space-x-3">
                <div class="relative flex-shrink-0">
                    <img 
                        src="${friendUser?.picture || '/assets/default-avatar.svg'}" 
                        alt="${friendUser?.fullName || 'USER'}" 
                        class="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-md group-hover:border-white/50 transition-all duration-300"
                        loading="lazy"
                    >
                    <!-- Online status indicator -->
                    <div class="absolute bottom-0 right-0 w-4 h-4 ${isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' : 'bg-red-400 shadow-lg shadow-red-400/50'} border-2 border-white rounded-full transition-all duration-300"></div>
                    
                    <!-- Unread message badge -->
                    ${unreadCount > 0 ? `
                        <div class="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-white">
                            ${unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-white ${unreadCount > 0 ? 'font-bold' : ''} truncate text-sm group-hover:text-white/90 transition-colors duration-300">
                            ${friendUser?.fullName || 'Unknown'}
                        </h3>
                        <div class="flex items-center gap-1">
                            <div class="w-2 h-2 ${isOnline ? 'bg-green-400' : 'bg-red-400'} rounded-full opacity-60"></div>
                            <span class="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-300">
                                ${isOnline ? i18n.t('chat.online') : i18n.t('chat.offline')}
                            </span>
                        </div>
                    </div>
                    
                    ${friendUser?.nickName ? `
                        <p class="text-xs text-white/70 group-hover:text-white/80 truncate mt-1 transition-colors duration-300">
                            @${friendUser.nickName}
                        </p>
                    ` : ''}
                </div>
            </div>
            
            <!-- Hover effect overlay -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </button>
    `;
        }).join('');

        userList.querySelectorAll('.user-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = (e.currentTarget as HTMLElement).getAttribute('data-friend-id');
                selectFriend(friendId, friendUsers);
            });
        });
    }
    else if (userList) {
        userList.innerHTML = `<div class="text-gray-500">${i18n.t('chat.noFriendsFound')}</div>`;
    }

    // Refresh socket auth token before connecting
    const currentToken = getAccessToken();
    if (currentToken) {
        (socket as any).auth.token = currentToken;
    }
    
    if (!socket.connected) {
        socket.connect();
    }
    setupSocketConnection();
    setupChatEvents();
    setupSidebarNotificationEventsAlternative();
    setupMobileResponsive();

    if (!notificationSound) {
        notificationSound = new Audio('/notification.mp3');
        notificationSound.volume = 0.5;
    }

    selectedFriend = null;
    startOnlineStatusRefresh();
}


function setupSidebarNotificationEventsAlternative() {
    const usersBox = document.getElementById('users-box');
    if (usersBox) {
        usersBox.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;

            if (target.id === 'notification-toggle-sidebar' ||
                target.closest('#notification-toggle-sidebar')) {
                e.preventDefault();
                e.stopPropagation();

                await showSidebarNotificationDropdown();
            }
        });
    }
}

setupSidebarNotificationEventsAlternative();

/**
 * Setup mobile responsive functionality for sidebar
 */
function setupMobileResponsive() {
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    const mobileClose = document.getElementById('mobile-sidebar-close');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('users-box');

    if (!mobileToggle || !mobileClose || !mobileOverlay || !sidebar) {
        console.warn('Mobile responsive elements not found');
        return;
    }

    // Toggle sidebar on mobile
    const toggleSidebar = (show: boolean) => {
        if (show) {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            mobileOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            mobileOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    };

    // Event listeners
    mobileToggle.addEventListener('click', () => toggleSidebar(true));
    mobileClose.addEventListener('click', () => toggleSidebar(false));
    mobileOverlay.addEventListener('click', () => toggleSidebar(false));

    // Close sidebar when selecting a friend on mobile
    const userList = document.getElementById('user-list');
    if (userList) {
        userList.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.user-item') && window.innerWidth < 768) {
                setTimeout(() => toggleSidebar(false), 300);
            }
        });
    }

    // Handle window resize
    const handleResize = () => {
        if (window.innerWidth >= 768) {
            toggleSidebar(false);
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
        }
    };

    window.addEventListener('resize', handleResize);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar(false);
        }
    });
}

export function setupSidebarNotificationEvents() {
    setTimeout(() => {
        console.log("Setting up sidebar notification events...");
        const notificationToggle = document.getElementById('notification-toggle-sidebar');

        if (notificationToggle) {
            const newButton = notificationToggle.cloneNode(true) as HTMLElement;
            notificationToggle.parentNode?.replaceChild(newButton, notificationToggle);

            newButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('🔔 Notification button clicked - starting dropdown');
                console.log('Current totalNotifications:', totalNotifications);
                console.log('Current notificationCounts:', notificationCounts);

                await showSidebarNotificationDropdown();
            });
        } else {
            console.error('❌ Notification button not found');
        }
    }, 500);
}

async function showSidebarNotificationDropdown() {
    console.log('🔔 Opening sidebar notification dropdown');

    const existing = document.getElementById('sidebar-notification-dropdown');
    if (existing) {
        existing.remove();
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'sidebar-notification-dropdown';

    dropdown.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        z-index: 9999;
        overflow: hidden;
    `;

    dropdown.innerHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-semibold text-gray-800">🔔 Notifications</h3>
                <button id="clear-all-notifications-sidebar" class="text-sm text-blue-600 hover:text-blue-800">Clear All</button>
            </div>
            <div id="sidebar-notification-list" class="max-h-60 overflow-y-auto">
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="text-sm text-gray-500 mt-2">${i18n.t('notifications.loading')}</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dropdown);

    try {
        const response = await api.getNotifications();
        const notificationList = document.getElementById('sidebar-notification-list');

        if (notificationList) {
            if (response.success && response.notifs && response.notifs.length > 0) {
                const notificationHTML = await Promise.all(
                    response.notifs.map(async (notif: any) => {
                        try {
                            const senderResponse = await api.getuserbyid(notif.senderId || notif.user1ID);
                            const senderName = senderResponse.user?.fullName || 'Unknown User';
                            const senderPicture = senderResponse.user?.picture || '';

                            return `
                                <div class="notification-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100" 
                                     data-notification-id="${notif.id}" 
                                     data-sender-id="${notif.senderId || notif.user1ID || notif.senderID}"
                                     data-notification-type="${notif.type || 'message'}">
                                    <div class="flex items-start space-x-3">
                                        <div class="relative">
                                            <img src="${senderPicture}" alt="${senderName}" class="w-8 h-8 rounded-full">
                                            ${notif.type === 'friend_request' ?
                                    '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>' :
                                    '<div class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>'
                                }
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center space-x-2">
                                                <p class="text-sm font-medium text-gray-900">${senderName}</p>
                                                ${notif.type === 'friend_request' ?
                                    '<span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Friend Request</span>' :
                                    '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Message</span>'
                                }
                                            </div>
                                            <p class="text-sm text-gray-600">${notif.content || notif.message || 'New notification'}</p>
                                            <p class="text-xs text-gray-400 mt-1">
                                                ${new Date(notif.createdAt || notif.sentAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div class="w-2 h-2 ${notif.type === 'friend_request' ? 'bg-green-500' : 'bg-blue-500'} rounded-full"></div>
                                    </div>
                                </div>
                            `;
                        } catch (error) {
                            console.error('Error processing notification:', error);
                            return `
                                <div class="notification-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                                    <div class="flex items-start space-x-3">
                                        <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">Unknown User</p>
                                            <p class="text-sm text-gray-600">${notif.content || notif.message || 'New notification'}</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    })
                );

                notificationList.innerHTML = (await Promise.all(notificationHTML)).join('');

                notificationList.querySelectorAll('.notification-item').forEach(item => {
                    item.addEventListener('click', async (e) => {
                        const senderId = (e.currentTarget as HTMLElement).getAttribute('data-sender-id');
                        notificationId = (e.currentTarget as HTMLElement).getAttribute('data-notification-id');
                        const notificationType = (e.currentTarget as HTMLElement).getAttribute('data-notification-type');

                        if (senderId) {
                            console.log('🔔 Clicking notification:', { senderId, notificationId, notificationType });

                            try {
                                if (notificationType === 'friend_request') {

                                    const pendingResponse = await api.getPendingFriendRequests();
                                    const currentUser = getCurrentUser();

                                    if (pendingResponse.success) {
                                        const pendingRequests = pendingResponse.requests || pendingResponse.pendingRequests || pendingResponse.pending || [];

                                        const requestsArray = Array.isArray(pendingRequests) ? pendingRequests : [];

                                        const matchingFriendship = requestsArray.find((req: any) =>
                                            (req.user1ID === senderId && req.user2ID === currentUser?.id) ||
                                            (req.user2ID === senderId && req.user1ID === currentUser?.id)
                                        );

                                        if (matchingFriendship) {
                                            const senderResponse = await api.getuserbyid(senderId);
                                            const friendRequest = {
                                                id: matchingFriendship.id,
                                                senderId: senderId,
                                                senderName: senderResponse.user?.fullName || 'Unknown',
                                                senderPicture: senderResponse.user?.picture || '',
                                                createdAt: matchingFriendship.createdAt || new Date().toISOString()
                                            };

                                            console.log('🔔 Friend request with correct friendship ID:', friendRequest);
                                            notificationService.showFriendRequestAlert(friendRequest, notificationId!);
                                        } else {
                                            console.log('⚠️ No matching pending friendship found, opening chat instead');
                                            selectFriend(senderId, globalFriendUsers);
                                        }
                                    } else {
                                        console.error('Failed to get pending friend requests');
                                        selectFriend(senderId, globalFriendUsers);
                                    }
                                } else {
                                    console.log('💬 Message notification clicked, opening chat with:', senderId);
                                    selectFriend(senderId, globalFriendUsers);
                                }

                            } catch (error) {
                                console.error('Error handling notification click:', error);
                                selectFriend(senderId, globalFriendUsers);
                            }

                            dropdown.remove();
                        }
                    });
                });

            } else {
                notificationList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"/>
                        </svg>
                        <p class="text-sm">${i18n.t('notifications.noNew')}</p>
                    </div>
                `;
            }
        }

        const clearAllBtn = document.getElementById('clear-all-notifications-sidebar');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', async () => {
                try {
                    console.log('🗑️ Clearing all notifications...');

                    clearAllBtn.textContent = 'Clearing...';
                    clearAllBtn.setAttribute('disabled', 'true');

                    try {
                        await api.clearAllNotifications();
                    } catch (apiError) {
                        console.warn('Could not clear notifications on server:', apiError);
                    }

                    notificationService.clearAllNotifications();

                    totalNotifications = 0;
                    notificationCounts = {};

                    const notificationList = document.getElementById('sidebar-notification-list');
                    if (notificationList) {
                        notificationList.innerHTML = `
                    <div class="text-center py-8 text-green-500">
                        <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="text-sm font-medium">All notifications cleared!</p>
                        <p class="text-xs text-gray-500 mt-1">You're all caught up</p>
                    </div>
                `;
                    }

                    setTimeout(() => {
                        dropdown.remove();
                    }, 1500);

                    console.log('✅ All notifications cleared successfully');

                } catch (error) {
                    console.error('Error clearing notifications:', error);
                    showModalNotification('error', '❌ Failed to clear notifications');

                    clearAllBtn.textContent = 'Clear All';
                    clearAllBtn.removeAttribute('disabled');
                }
            });
        }

    } catch (error) {
        console.error('💥 Error in showSidebarNotificationDropdown:', error);
        const notificationList = document.getElementById('sidebar-notification-list');
        if (notificationList) {
            notificationList.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-sm">Failed to load notifications</p>
                    <button class="mt-2 text-xs text-blue-600 hover:text-blue-800" onclick="showSidebarNotificationDropdown()">Try again</button>
                </div>
            `;
        }
    }

    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target as Node) &&
                !document.getElementById('notification-toggle-sidebar')?.contains(e.target as Node)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}


function setupSocketConnection() {
    if (isSocketSetup) return;
    isSocketSetup = true;

    socket.on('connect', () => {
        console.log('Socket connected');
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id) {
            socket.emit('user-joined', { userId: currentUser.id });

            setTimeout(() => {
                socket.emit('get-online-users');
            }, 1000);
        }
    });

    socketNotification?.on('users-online', (data: { userIds: string[] }) => {
        updateOnlineUsers(data.userIds);
    });

    socketNotification?.on('user-status-changed', (data: { userId: string; status: 'online' | 'offline' }) => {
        if (data.status === 'online') {
            if (!onlineUsers.includes(data.userId)) {
                onlineUsers.push(data.userId);
            }
        } else {
            onlineUsers = onlineUsers.filter(id => id !== data.userId);
        }

        updateFriendListOnlineStatus();

        // Update chat header online status via ChatPageManager
        if (chatPageManager) {
            chatPageManager.updateFriendOnlineStatus();
        }
    });

    socket.on('connect_error', async (err: Error & { message: string }) => {
        console.error('🔌 Socket connection error:', err);
        if (err.message === 'Authentication error') {
            try {
                const ok = await verifyToken();
                if (ok) {
                    const newToken = getAccessToken();
                    (socket as any).auth.token = newToken;
                    socket.connect();
                } else {
                    await logout();
                    navigateTo('/');
                }
            } catch (refreshError) {
                await logout();
                navigateTo('/');
            }
        }
    });


    socket.on('disconnect', (reason: string) => {
        console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('user-joined-success', (data: unknown) => {
        console.log('✅ Successfully joined socket:', data);
    });

    socket.on('user-joined-error', (error: unknown) => {
        console.error('❌ Failed to join socket:', error);
    });

    socket.on('new-private-message', (messageData: {
        id: string;
        senderId: string;
        receiverId: string;
        content: string;
        sentAt: string;
        senderName: string;
    }) => {
        handleNewPrivateMessage(messageData);
    });

    // message-sent-success is handled by ChatPageManager

    socket.on('friend-request-received', (data: any) => {
        if (typeof notificationService !== 'undefined') {
            notificationService.showFriendRequestAlert(data, notificationId!);
            notificationService.playNotificationSound();
        }


        if (notificationSound) {
            notificationSound.play().catch(e => console.log('Could not play notification sound:', e));
        }

        if (Notification.permission === 'granted') {
            new Notification(`🤝 Friend Request from ${data.senderName}`, {
                body: 'Click to accept or reject',
                icon: data.senderPicture || '/favicon.ico'
            });
        }

        console.log('📨 Friend request received from:', data.senderName);
    });

    socket.on('friend-request-accepted', (data: { friendName: string }) => {
        showModalNotification('success', `🎉 ${data.friendName} ${i18n.t('chat.acceptedFriendRequest')}!`);

        setTimeout(() => {
            window.location.reload();
        }, 2000);
    });

    socket.on('friend-request-rejected', (data: { friendName: string }) => {
        showModalNotification('info', `${data.friendName} ${i18n.t('chat.declinedFriendRequest')}.`);
    });

    // message-sent-error is handled by ChatPageManager
}


function handleNewPrivateMessage(messageData: any) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Only handle notifications for messages not from current conversation
    // ChatPageManager handles message display for current conversation
    if (messageData.senderId !== currentUser.id && 
        (!selectedFriend || messageData.senderId !== selectedFriend.id)) {
        
        if (!notificationCounts[messageData.senderId]) {
            notificationCounts[messageData.senderId] = 0;
        }
        notificationCounts[messageData.senderId]++;
        totalNotifications++;

        updateNotificationBadge();

        if (typeof notificationService !== 'undefined') {
            notificationService.addNotification(messageData.senderId, messageData);
        }

        if (notificationSound) {
            notificationSound.play().catch(e => console.log('Could not play notification sound:', e));
        }

        console.log(`📨 ${i18n.t('chat.newMessageNotification')} ${messageData.senderName}: ${messageData.content.substring(0, 50)}...`);
    }
}


function updateNotificationBadge() {
    const notificationToggle = document.getElementById('notification-toggle-sidebar');
    if (notificationToggle) {
        const existingBadge = notificationToggle.querySelector('.absolute');
        if (existingBadge) {
            existingBadge.remove();
        }

        if (totalNotifications > 0) {
            const badge = document.createElement('div');
            badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce';
            badge.textContent = totalNotifications > 99 ? '99+' : totalNotifications.toString();
            notificationToggle.appendChild(badge);
        }
    }
}

function getCurrentFriendUsers(): any[] {
    return globalFriendUsers || [];
}


function setupChatEvents() {
    if (isEventsSetup) return;
    isEventsSetup = true;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
            navigateTo('/');
        });
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            socket.emit('request-user-list');
        });
    }

    // Message form handling removed - ChatPageManager handles message form events

    messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
}



export function setupAddUserModal() {
    console.log('🔍 Setting up add user modal...');

    const modal = document.getElementById('add-user-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const searchInput = document.getElementById('search-user-input') as HTMLInputElement;

    if (modal) {
        modal.classList.remove('hidden');
        console.log('✅ Modal shown');

        setTimeout(() => {
            if (searchInput) {
                searchInput.focus();
            }
        }, 100);

        hideModalNotification();
        updateSearchStats('', 0);
    } else {
        console.error('❌ Modal not found');
        return;
    }

    if (closeModalBtn) {
        const newCloseBtn = closeModalBtn.cloneNode(true) as HTMLElement;
        closeModalBtn.parentNode?.replaceChild(newCloseBtn, closeModalBtn);

        newCloseBtn.addEventListener('click', () => {
            console.log('❌ Close button clicked');
            hideAddUserModal();
        });
    }

    const newModal = document.getElementById('add-user-modal');
    if (newModal) {
        newModal.addEventListener('click', (e) => {
            if (e.target === newModal) {
                console.log('❌ Modal background clicked');
                hideAddUserModal();
            }
        });
    }

    if (searchInput) {
        let searchTimeout: number;
        let isSearching = false;

        const newSearchInput = searchInput.cloneNode(true) as HTMLInputElement;
        searchInput.parentNode?.replaceChild(newSearchInput, searchInput);

        // Add loading indicator to search input
        const searchContainer = newSearchInput.parentElement;
        if (searchContainer) {
            searchContainer.style.position = 'relative';
        }

        newSearchInput.addEventListener('focus', () => {
            console.log('🔍 Search input focused');
            if (!newSearchInput.value.trim()) {
                clearSearchResults();
            }
        });

        newSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = (e.target as HTMLInputElement).value.trim();
            console.log('🔍 Search query:', query);

            hideModalNotification();

            // Clear results immediately if query is empty
            if (!query) {
                clearSearchResults();
                return;
            }

            // Show loading state
            if (!isSearching) {
                showSearchLoading();
            }

            searchTimeout = window.setTimeout(async () => {
                isSearching = true;
                await searchUsers(query);
                isSearching = false;
                hideSearchLoading();
            }, 300);
        });

        newSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideAddUserModal();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                const query = newSearchInput.value.trim();
                if (query) {
                    isSearching = true;
                    showSearchLoading();
                    searchUsers(query).finally(() => {
                        isSearching = false;
                        hideSearchLoading();
                    });
                }
            }
        });

        // Clear search when input is cleared
        newSearchInput.addEventListener('blur', () => {
            if (!newSearchInput.value.trim()) {
                clearSearchResults();
            }
        });
    } else {
        console.error('❌ Search input not found');
    }

    console.log('✅ Add user modal setup complete');
}


function hideAddUserModal() {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!2");
    const modal = document.getElementById('add-user-modal');
    if (modal) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!3");
        modal.classList.add('hidden');
        clearSearchResults();
        hideModalNotification();
    }
}



export async function searchUsers(query: string) {
    console.log('🔍 Searching users with query:', query);

    // Clear results if query is empty
    if (!query || query.trim() === '') {
        clearSearchResults();
        return;
    }

    try {
        showModalNotification('info', i18n.t('chat.searchingUsers'));

        // Fetch all required data in parallel for better performance
        const [usersResponse, friendsResponse, blockedResponse] = await Promise.all([
            api.getAllUsers(),
            api.readFriendList(),
            api.getBlockedUsers().catch(() => ({ blockedUsers: [] })) // Fallback if blocked users API fails
        ]);

        const currentUser = getCurrentUser();
        if (!currentUser) {
            showModalNotification('error', i18n.t('chat.userSessionExpired'));
            return;
        }

        // Get existing friends IDs
        const existingFriends = friendsResponse.friendship || [];
        const friendIds = existingFriends.map((friend: any) =>
            friend.user1ID === currentUser.id ? friend.user2ID : friend.user1ID
        );

        // Get blocked users IDs
        const blockedUsers = blockedResponse.blockedUsers || blockedResponse.users || [];
        const blockedIds = Array.isArray(blockedUsers) 
            ? blockedUsers.map((blocked: any) => blocked.id || blocked.userId || blocked.targetUserId)
            : [];

        // Filter users: exclude current user, friends, and blocked users
        let users = usersResponse.users || [];
        users = users.filter((user: any) => {
            const isCurrentUser = user.id === currentUser.id;
            const isFriend = friendIds.includes(user.id);
            const isBlocked = blockedIds.includes(user.id);
            
            return !isCurrentUser && !isFriend && !isBlocked;
        });

        // Apply search filter
        if (query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            users = users.filter((user: any) => {
                const fullName = (user.fullName || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const nickName = (user.nickName || '').toLowerCase();
                
                return fullName.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       nickName.includes(searchTerm);
            });
        }

        updateSearchStats(query, users.length);
        hideModalNotification();

        if (users.length === 0) {
            showModalNotification('warning', `${i18n.t('chat.noUsersFound')} "${query}"`);
        }

        displaySearchResults(users);
        
    } catch (error) {
        console.error('❌ Error searching users:', error);
        showModalNotification('error', i18n.t('chat.failedToSearchUsers'));
        updateSearchStats(query, 0);
        displaySearchResults([]);
    }
}


function displaySearchResults(users: any[]) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (users.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-8 sm:py-12 text-gray-500">
                <div class="relative mb-3 sm:mb-4">
                    <div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-full blur"></div>
                    <div class="relative bg-gradient-to-r from-orange-100 to-blue-100 p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                        <svg class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                </div>
                <h4 class="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">${i18n.t('chat.noResultsFound')}</h4>
                <p class="text-xs sm:text-sm text-gray-500">${i18n.t('chat.tryDifferentKeywords')}</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = users.map((user, index) => `
        <div class="group relative bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/80 hover:border-orange-300/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-bottom-2" style="animation-delay: ${index * 50}ms">
            <!-- Gradient hover effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-blue-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div class="relative flex items-center justify-between">
                <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <!-- Enhanced profile image -->
                    <div class="relative flex-shrink-0">
                        <div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                        <img src="${user.picture || '/default-avatar.png'}" 
                             alt="${user.fullName}" 
                             class="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/50 shadow-md group-hover:border-orange-300/50 transition-all duration-300"
                             onerror="this.src='/default-avatar.png'">
                        <!-- Online status indicator -->
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                    
                    <!-- User info -->
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors text-sm sm:text-base truncate">${user.fullName || i18n.t('chat.unknown')}</h4>
                        <p class="text-xs sm:text-sm text-gray-500 group-hover:text-gray-600 transition-colors truncate">${user.email || ''}</p>
                        ${user.nickName && user.nickName !== user.fullName ? `<p class="text-xs text-orange-600 font-medium truncate">@${user.nickName}</p>` : ''}
                    </div>
                </div>
                
                <!-- Enhanced add friend button -->
                <button 
                    class="add-friend-btn group/btn relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                    data-user-id="${user.id}"
                    data-user-name="${user.fullName || 'Unknown'}"
                >
                    <span class="relative z-10 flex items-center space-x-1 sm:space-x-2">
                        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span class="text-xs sm:text-sm">${i18n.t('chat.add')}</span>
                    </span>
                    <!-- Button shine effect -->
                    <div class="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out"></div>
                </button>
            </div>
        </div>
    `).join('');

    // Add enhanced event listeners with improved feedback
    resultsContainer.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const userId = target.getAttribute('data-user-id');
            const userName = target.getAttribute('data-user-name');

            if (userId) {
                await addFriend(userId, userName || 'Unknown', target);
            }
        });
    });
}


async function checkForPendingRequests() {
    try {
        console.log('🔍 Checking for pending friend requests...');
        const response = await api.getPendingFriendRequests();
        console.log('📋 API Response:', response);

        const pendingRequests = response.requests || response.pendingRequests || response.pending || [];

        if (response && response.success && Array.isArray(pendingRequests)) {
            if (pendingRequests.length > 0) {
                console.log(`🔔 Found ${pendingRequests.length} pending requests`);

                const currentUser = getCurrentUser();

                const validRequests = pendingRequests.filter(req =>
                    req.user1ID !== currentUser?.id
                );

                const requestPromises = validRequests.map(async (req) => {
                    try {
                        const usersender = await api.getuserbyid(req.user1ID);

                        return {
                            id: req.id,
                            senderId: req.user1ID,
                            senderName: usersender.user?.fullName || req.senderName || i18n.t('chat.unknown'),
                            senderPicture: usersender.user?.picture || req.senderPicture || '',
                            createdAt: req.createdAt || new Date().toISOString()
                        };
                    } catch (userError) {
                        console.error('Error fetching sender info for:', req.user1ID, userError);

                        return {
                            id: req.id,
                            senderId: req.user1ID,
                            senderName: req.senderName || i18n.t('chat.unknown'),
                            senderPicture: req.senderPicture || '',
                            createdAt: req.createdAt || new Date().toISOString()
                        };
                    }
                });

                const processedRequests = await Promise.all(requestPromises);

                processedRequests.forEach(requestData => {
                    console.log('🔔 Showing alert for request from:', requestData.senderName);
                    notificationService.showFriendRequestAlert(requestData, notificationId!);
                });

            } else {
                console.log('ℹ️ No pending requests found');
            }
        } else {
            console.log('ℹ️ Invalid response format or no success flag');
        }
    } catch (error) {
        console.error('❌ Error checking pending requests:', error);
    }
}


async function addFriend(friendId: string, friendName: string, buttonElement: HTMLElement) {
    try {
        console.log('👤 Adding friend:', friendName);

        buttonElement.textContent = i18n.t('chat.adding');
        buttonElement.setAttribute('disabled', 'true');
        buttonElement.classList.add('opacity-50', 'cursor-not-allowed');

        showModalNotification('info', i18n.t('chat.sendingFriendRequest'));

        const response = await api.addFriend(friendId);
        const currentUser = getCurrentUser();

        if (response.success) {
            buttonElement.textContent = `✓ ${i18n.t('chat.requestSent')}!`;
            buttonElement.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'opacity-50', 'cursor-not-allowed');
            buttonElement.classList.add('bg-green-600');

            showModalNotification('success', `${i18n.t('chat.friendRequestSent')} ${friendName}! 🚀`);

            // ✅ USE the sendFriendRequestNotification function
            await sendFriendRequestNotification(friendId, friendName);

            // Also send socket notification for real-time
            try {
                if (socketNotification && socketNotification.connected) {
                    socketNotification.emit('send-friend-request', {
                        receiverId: friendId,
                        requestId: response.friendshipId || response.id,
                        senderName: currentUser?.fullName,
                        senderPicture: currentUser?.picture
                    });
                    console.log('✅ Friend request notification sent via socket');
                } else {
                    console.log('⚠️ Notification socket not connected, friend request will be shown when recipient logs in');
                }
            } catch (socketError) {
                console.error('⚠️ Error sending socket notification:', socketError);
            }

            setTimeout(() => {
                hideAddUserModal();
            }, 2000);

        } else {
            throw new Error(response.message || 'Failed to send friend request');
        }
    } catch (error) {
        console.error('❌ Error adding friend:', error);

        buttonElement.textContent = `✗ ${i18n.t('chat.failed')}`;
        buttonElement.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        buttonElement.classList.add('bg-red-600');

        const errorMessage = error instanceof Error ? error.message : i18n.t('chat.failedToSendFriendRequest');
        showModalNotification('error', errorMessage);

        setTimeout(() => {
            buttonElement.textContent = i18n.t('chat.addFriend');
            buttonElement.classList.remove('bg-red-600', 'opacity-50', 'cursor-not-allowed');
            buttonElement.classList.add('bg-blue-600', 'hover:bg-blue-700');
            buttonElement.removeAttribute('disabled');
        }, 3000);
    }
}

async function sendFriendRequestNotification(friendId: string, friendName: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const response = await api.sendNotification(
            `${currentUser.fullName} ${i18n.t('chat.sentYouFriendRequest')}!`,
            "friend_request",
            [friendId]
        );

        if (response.success) {
            console.log(`✅ Friend request notification sent to ${friendName}`);
        } else {
            console.error('Failed to send friend request notification:', response);
        }
    } catch (error) {
        console.error('Error sending friend request notification:', error);
    }
}




function selectFriend(friendId: string | null, friendUsers: any[]) {
    if (!friendId) return;

    const friend = friendUsers.find(friend => friend?.id === friendId);
    
    // Check if the same friend is already selected to prevent unnecessary reload
    if (selectedFriend && selectedFriend.id === friendId) {
        console.log('Same friend already selected, skipping reload');
        return;
    }
    
    selectedFriend = friend;
    receiverSocketId = friendId;

    if (!selectedFriend) {
        console.error(i18n.t('chat.friendNotFound'));
        return;
    }

    // Clear notifications for this friend
    if (typeof notificationService !== 'undefined') {
        notificationService.clearNotificationsForFriend(friendId);
    }

    if (notificationCounts[friendId]) {
        totalNotifications -= notificationCounts[friendId];
        notificationCounts[friendId] = 0;
    }

    updateNotificationBadge();

    // Initialize ChatPageManager with the selected friend
    const chatContainer = document.getElementById('chat-page-container');
    if (chatContainer) {
        // Only destroy and recreate if we don't have a chat manager or friend changed
        if (chatPageManager) {
            // Update existing chat manager with new friend
            chatPageManager.updateProps({ selectedFriend: selectedFriend });
        } else {
            // Create new ChatPageManager instance
            chatPageManager = new ChatPageManager(chatContainer, {
                selectedFriend: selectedFriend,
                socket: socket,
                onFriendSelect: (friend) => {
                    if (friend?.id) {
                        selectFriend(friend.id, friendUsers);
                    }
                }
            });
        }
    }
}



// Old message form functions removed - now handled by ChatPageManager
// These functions are no longer needed as ChatPageManager handles all message UI

let currentFriendId: string | null = null;



function getOnlineStatus(userId: string): boolean {
    const isOnline = onlineUsers.includes(userId);
    console.log(`Checking online status for ${userId}: ${isOnline ? 'online' : 'offline'}`);
    return isOnline;
}

// Expose getOnlineStatus globally for ChatPageManager
(window as any).getOnlineStatus = getOnlineStatus;

function updateOnlineUsers(userIds: string[]) {
    console.log('🔄 Updating online users list:', userIds);
    const previousOnlineUsers = [...onlineUsers];
    onlineUsers = [...userIds];

    const newlyOnline = onlineUsers.filter(id => !previousOnlineUsers.includes(id));
    const newlyOffline = previousOnlineUsers.filter(id => !onlineUsers.includes(id));


    updateFriendListOnlineStatus();

    // Update chat header online status via ChatPageManager
    if (chatPageManager) {
        chatPageManager.updateFriendOnlineStatus();
    }
}

function updateFriendListOnlineStatus() {
    console.log('🔄 Updating friend list online status...');
    const userItems = document.querySelectorAll('.user-item');

    userItems.forEach(item => {
        const friendId = item.getAttribute('data-friend-id');
        if (!friendId) return;

        const isOnline = getOnlineStatus(friendId);
        console.log(`Friend ${friendId} is ${isOnline ? 'online' : 'offline'}`);

        const statusDot = item.querySelector('.absolute.bottom-0.right-0.w-4.h-4');
        if (statusDot) {
            statusDot.className = statusDot.className
                .replace(/bg-green-400|bg-red-400/g, '')
                .replace(/animate-pulse/g, '');

            if (isOnline) {
                statusDot.classList.add('bg-green-400', 'animate-pulse');
            } else {
                statusDot.classList.add('bg-red-400');
            }

            console.log(`✅ Updated status dot for ${friendId}: ${isOnline ? 'green' : 'red'}`);
        }
    });
}


// updateChatHeaderForFriend function removed - ChatPageManager handles chat header



// setupChatOptionsEvents and setupHeaderNotificationEvents removed - ChatPageManager handles these



// showChatOptionsMenu function removed - ChatPageManager handles chat options menu


function setupChatOptionsHandlers(dropdown: HTMLElement) {
    const clearChatBtn = dropdown.querySelector('#clear-chat-btn');
    const blockUserBtn = dropdown.querySelector('#block-user-btn');
    const userInfoBtn = dropdown.querySelector('#user-info-btn');
    const playGameBtn = dropdown.querySelector('#play-game-btn');

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', async () => {
            await clearCurrentChat();
            dropdown.remove();
        });
    }

    if (blockUserBtn) {
        blockUserBtn.addEventListener('click', async () => {
            await clearCurrentChat();
            await blockCurrentUser();
            dropdown.remove();
        });
    }

    if (userInfoBtn) {
        userInfoBtn.addEventListener('click', () => {
            showUserInfo();
            dropdown.remove();
        });
    }

    if (playGameBtn) {
        playGameBtn.addEventListener('click', () => {
            startGameWithFriend();
            dropdown.remove();
        });
    }
}


async function clearCurrentChat() {
    if (!selectedFriend) {
        console.error(i18n.t('chat.noFriendSelected'));
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No current user found');
        return;
    }

    const confirmed = confirm(
        `${i18n.t('chat.confirmClearMessages')} ${selectedFriend.fullName}?\n\n` +
        `⚠️ ${i18n.t('chat.clearMessagesWarning')}`
    );

    if (!confirmed) {
        return;
    }

    try {
        const messageContainer = document.getElementById('message-container') as HTMLElement;
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-gray-600">${i18n.t('chat.clearingConversation')}</span>
                </div>
            `;
        }

        if (!currentUser.id || !selectedFriend.id) {
            throw new Error('User ID or Friend ID is missing');
        }
        const response = await api.clearConversation(currentUser.id, selectedFriend.id);
        if (response.success) {
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-16 text-gray-500">
                        <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        <h3 class="text-lg font-medium text-gray-700 mb-2">${i18n.t('chat.conversationCleared')}</h3>
                        <p class="text-sm text-center">${i18n.t('chat.allMessagesDeleted')}<br>${i18n.t('chat.startNewConversation')}</p>
                    </div>
                `;
            }

            const deletedCount = response.deletedCount || 0;
            showModalNotification('success', `✅ ${i18n.t('chat.conversationCleared')}! ${deletedCount} ${i18n.t('chat.messagesDeleted')}.`);

            if (socket) {
                socket.emit('conversation-cleared', {
                    clearedBy: currentUser.id,
                    otherUser: selectedFriend.id,
                    clearedByName: currentUser.fullName
                });
            }

            console.log(`✅ Conversation cleared: ${response.message}`);

        } else {
            throw new Error(response.message || i18n.t('chat.failedToClearConversation'));
        }

    } catch (error) {
        console.error('❌ Error clearing conversation2:', error);

        if (selectedFriend && chatPageManager) {
            // ChatPageManager will handle conversation reloading
            console.log('Conversation will be reloaded by ChatPageManager');
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showModalNotification('error', `❌ ${i18n.t('chat.failedToClearConversation')}: ${errorMessage}`);

        alert(`${i18n.t('chat.failedToClearConversation')}: ${errorMessage}\n\n${i18n.t('chat.tryAgainOrContactSupport')}`);
    }
}


export async function blockCurrentUser() {
    if (!selectedFriend) {
        console.error('No friend selected');
        return;
    }

    const confirmed = confirm(
        `${i18n.t('chat.confirmBlockUser')} ${selectedFriend.fullName}?\n\n` +
        `⚠️ ${i18n.t('chat.blockUserWarning')}`
    );

    if (!confirmed) return;

    try {
        const response = await api.bockfrienduser(selectedFriend.id);
        console.log("responce of blockfrienduser: ", response);
        if (response.success) {
            showModalNotification('success', `✅ ${i18n.t('chat.userBlockedSuccessfully')}!`);

            // Remove from friend list UI
            const friendItem = document.querySelector(`[data-friend-id="${selectedFriend.id}"]`);
            if (friendItem) {
                friendItem.remove();
            }

            // Clear current chat
            selectedFriend = null;
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
                messageContainer.innerHTML = `<p class="text-gray-500 text-center py-8">${i18n.t('chat.selectFriendToStartChatting')}</p>`;
            }

            // Update chat header
            const chatHeader = document.getElementById('chat-header');
            if (chatHeader) {
                chatHeader.innerHTML = `<p class="text-gray-700">${i18n.t('chat.selectUserToStartChatting')}</p>`;
            }
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        showModalNotification('error', `❌ ${i18n.t('chat.failedToBlockUser')}`);
    }
}

export async function showUserInfo() {
    if (!selectedFriend) return;

    try {
        const app = document.getElementById("app");
        app!.innerHTML = '';
        const userData = await api.getuserbyid(selectedFriend.id);
        if (!userData?.user) return;

        if (!app) return;
        const isOnline = getOnlineStatus(selectedFriend.id);
        app.innerHTML = `
            <!-- Friend Profile Page Container with Consistent Design -->
            <div class="min-h-screen bg-transparent text-white overflow-x-hidden">
                <!-- Enhanced Header with Profile Page Consistency -->
                <div class="relative overflow-hidden bg-gradient-to-br from-orange-500/20 via-red-500/20 rounded-xl to-pink-500/20 
                     backdrop-filter backdrop-blur-xl border-b border-orange-400/40 shadow-2xl mb-8">
                    <div class="absolute inset-0 bg-gradient-to-r from-orange-400/15 to-red-400/15"></div>
                    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                        <!-- Back Button -->
                        <div class="mb-6">
                            <button 
                                id="back-to-chat" 
                                class="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md hover:shadow-lg backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
                            >
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                                ${i18n.t('chat.backToChat')}
                            </button>
                        </div>
                        <div class="text-center space-y-4">
                            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-300 via-red-300 to-pink-300 bg-clip-text text-transparent mb-6 tracking-tight">
                                ${i18n.t('chat.friendProfile')}
                            </h1>
                            <p class="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto font-medium">
                                ${i18n.t('chat.viewUserInfoAndStats')} 🏆
                            </p>
                            <div class="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Container -->
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">

                    <!-- Enhanced User Info Section with Glass Morphism -->
                    <div class="relative overflow-hidden rounded-3xl w-full 
                         bg-gradient-to-br from-white/10 via-white/5 to-transparent 
                         backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl p-8 sm:p-10
                         hover:shadow-orange-500/20 hover:border-orange-400/30 transition-all duration-500
                         before:absolute before:inset-0 before:bg-gradient-to-br before:from-orange-500/5 before:to-red-500/5 before:rounded-3xl">
                        <div class="relative z-10">
                            <div class="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                                
                                <!-- Enhanced User Avatar -->
                                <div class="relative group">
                                    <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur-sm"></div>
                                    <img 
                                        src="${userData.user.picture || '/default-avatar.png'}" 
                                        alt="${userData.user.fullName || 'User'}" 
                                        class="relative w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
                                    />
                                    <div class="absolute bottom-0 right-0 w-6 h-6 ${isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' : 'bg-red-400 shadow-lg shadow-red-400/50'} border-3 border-white rounded-full transition-all duration-300"></div>
                                </div>
                                
                                <!-- Enhanced User Details -->
                                <div class="flex-1 text-center md:text-left">
                                    <h2 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">${userData.user.fullName || i18n.t('chat.unknownUser')}</h2>
                                    <p class="text-gray-300 mb-2 text-lg">${userData.user.email || i18n.t('chat.noEmailProvided')}</p>
                                    <div class="flex items-center justify-center md:justify-start space-x-2 mb-6">
                                        <div class="w-3 h-3 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'} rounded-full"></div>
                                        <span class="text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}">${isOnline ? i18n.t('chat.online') : i18n.t('chat.offline')}</span>
                                    </div>
                                    
                                    <!-- Enhanced User Stats Quick View -->
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                        <div class="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-400/30 text-white rounded-2xl p-6 text-center hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105">
                                            <div class="text-3xl font-bold text-blue-300" id="total-games-preview">-</div>
                                            <div class="text-sm text-blue-200 font-medium mt-1">${i18n.t('chat.totalGames')}</div>
                                        </div>
                                        <div class="relative overflow-hidden bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-400/30 text-white rounded-2xl p-6 text-center hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105">
                                            <div class="text-3xl font-bold text-green-300" id="total-wins-preview">-</div>
                                            <div class="text-sm text-green-200 font-medium mt-1">${i18n.t('chat.wins')}</div>
                                        </div>
                                        <div class="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-400/30 text-white rounded-2xl p-6 text-center hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-105">
                                            <div class="text-3xl font-bold text-purple-300" id="win-rate-preview">-</div>
                                            <div class="text-sm text-purple-200 font-medium mt-1">${i18n.t('chat.winRate')}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div class="flex flex-col sm:flex-row gap-4 mt-8 justify-center md:justify-start">
                                        <button 
                                            id="play-game-btn" 
                                            class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl backdrop-blur-md border border-green-400/30 hover:border-green-300/50 transition-all duration-300 transform hover:scale-105 group"
                                        >
                                            <svg class="w-6 h-6 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            ${i18n.t('chat.playGame')}
                                        </button>
                                        
                                        <button 
                                            id="block-user-btn" 
                                            class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl backdrop-blur-md border border-red-400/30 hover:border-red-300/50 transition-all duration-300 transform hover:scale-105 group"
                                        >
                                            <svg class="w-6 h-6 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                            </svg>
                                            ${i18n.t('chat.blockUser')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Games Section with Glass Morphism -->
                    <div class="relative overflow-hidden rounded-3xl w-full 
                         bg-gradient-to-br from-white/10 via-white/5 to-transparent 
                         backdrop-filter backdrop-blur-xl border border-white/20 shadow-2xl p-8 sm:p-10
                         hover:shadow-blue-500/20 hover:border-blue-400/30 transition-all duration-500
                         before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5 before:rounded-3xl">
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-8">
                                <h3 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent flex items-center">
                                    <div class="relative mr-4">
                                        <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg opacity-75 blur-sm"></div>
                                        <svg class="relative w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    ${i18n.t('chat.gameHistory')}
                                </h3>
                                <div class="text-sm text-gray-300 flex items-center" id="games-loading">
                                    <div class="relative mr-3">
                                        <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-400/30 border-t-blue-400"></div>
                                    </div>
                                    <span class="font-medium">${i18n.t('chat.loadingGames')}</span>
                                </div>
                            </div>
                            
                            <!-- Enhanced Games Grid -->
                            <div id="user-games" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <!-- Games will be populated here -->
                            </div>
                            
                            <!-- Enhanced Empty State -->
                            <div id="no-games" class="hidden text-center py-16">
                                <div class="relative inline-block mb-6">
                                    <div class="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full opacity-50 blur-lg"></div>
                                    <svg class="relative w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <h4 class="text-2xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent mb-3">${i18n.t('chat.noGamesYet')}</h4>
                                <p class="text-gray-400 text-lg">${i18n.t('chat.noGamesDescription')}</p>
                            </div>
                        </div>
                    </div>   
                </div>
            </div>
        `;

        // Add back button functionality
        const backButton = document.getElementById('back-to-chat');
        if (backButton) {
            backButton.addEventListener('click', () => {
                navigateTo('/chat');
            });
        }

        // Add Play Game button functionality
        const playGameButton = document.getElementById('play-game-btn');
        if (playGameButton) {
            playGameButton.addEventListener('click', () => {
                startGameWithFriend();
            });
        }

        // Add Block User button functionality
        const blockUserButton = document.getElementById('block-user-btn');
        if (blockUserButton) {
            blockUserButton.addEventListener('click', async () => {
                await blockCurrentUser();
            });
        }

        // Load games and update stats
        await renderUserGames(userData.user.id);

    } catch (error) {
        console.error("Error loading user info:", error);
        showErrorPage();
    }
}

async function renderUserGames(userId: string) {
    let totalWins = 0, totalLosses = 0, totalGames = 0;
    let trendData: number[] = [];
    let allGameCards: string[] = [];

    try {
        const gamesData = await api.getusergames(userId);
        const container = document.getElementById("user-games");
        const loadingIndicator = document.getElementById("games-loading");
        const noGamesDiv = document.getElementById("no-games");

        if (!container) return;

        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        if (!gamesData?.games?.length) {
            if (noGamesDiv) {
                noGamesDiv.classList.remove('hidden');
            }
            updateUserStatsPreview(0, 0, 0);
            return;
        }

        totalGames = gamesData.games.length;

        const gameCards = await Promise.all(
            gamesData.games.map(async (game: Game, index: number) => {
                try {
                    // ✅ Fix 1: Get participants from API
                    const { participants }: { participants: GameParticipant[] } = await api.getGameParticipants(game.id);
                    if (!participants.length) return '';

                    // ✅ Fix 2: Find user and opponent correctly
                    const userParticipant = participants.find(p => p.userId === userId);
                    const opponent = participants.find(p => p.userId !== userId);

                    if (!userParticipant || !opponent) return '';

                    // ✅ Fix 3: Calculate winner/draw status correctly
                    const isWinner = userParticipant.isWinner ?? false;
                    const isDraw = participants.every(p => p.score === participants[0]?.score);

                    // ✅ Fix 4: Update win/loss counters
                    if (isWinner) totalWins++;
                    else if (!isDraw) totalLosses++;

                    const resultIcon = isDraw ? '⚪' : isWinner ? '🏆' : '💔';
                    const resultText = isDraw ? 'Draw' : isWinner ? 'Victory' : 'Defeat';
                    const resultColor = isDraw ? 'text-gray-600' : isWinner ? 'text-green-600' : 'text-red-600';
                    const borderColor = isDraw ? 'border-gray-400' : isWinner ? 'border-green-500' : 'border-red-500';

                    const userScore = userParticipant.score ?? 0;
                    const opponentScore = opponent.score ?? 0;

                    // ✅ Fix 5: Handle date formatting properly
                    const gameDate = new Date(game.createdAt || game.finishedAt || Date.now());
                    const formattedDate = gameDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // ✅ Fix 6: Remove theme reference and use fixed background
                    const cardBg = 'bg-white';

                    // ✅ Fix 7: Get opponent info for display
                    const opponentInfo = await api.getuserbyid(opponent.userId);

                    return `
                        <div class="relative overflow-hidden rounded-2xl 
                             bg-gradient-to-br from-white/10 via-white/5 to-transparent 
                             backdrop-filter backdrop-blur-md border border-white/20 shadow-lg 
                             hover:shadow-xl hover:border-white/30 transition-all duration-300 
                             transform hover:scale-105 p-6
                             before:absolute before:inset-0 before:bg-gradient-to-br before:${isDraw ? 'from-gray-500/10 before:to-gray-600/10' : isWinner ? 'from-green-500/10 before:to-green-600/10' : 'from-red-500/10 before:to-red-600/10'} before:rounded-2xl">
                            <div class="relative z-10">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-bold text-white text-lg">Game #${index + 1}</h3>
                                    <div class="text-3xl transform transition-transform duration-300 hover:scale-110">${resultIcon}</div>
                                </div>
                                
                                <!-- Enhanced Opponent Info -->
                                <div class="flex items-center mb-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                    <div class="relative">
                                        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-50 blur-sm"></div>
                                        <img 
                                            src="${opponentInfo?.user?.picture || '/default-avatar.png'}" 
                                            alt="${opponentInfo?.user?.fullName || 'Player'}" 
                                            class="relative w-10 h-10 rounded-full object-cover border-2 border-white/30"
                                        >
                                    </div>
                                    <span class="ml-3 text-sm font-medium text-gray-200 truncate">${opponentInfo?.user?.fullName || 'Unknown Player'}</span>
                                </div>
                                
                                <div class="space-y-3 text-sm">
                                    <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <span class="text-gray-300 font-medium">Result:</span>
                                        <span class="${resultColor} font-bold text-lg">${resultText}</span>
                                    </div>
                                    
                                    <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <span class="text-gray-300 font-medium">${i18n.t('chat.score')}:</span>
                                        <span class="font-mono font-bold text-white text-lg">${userScore} : ${opponentScore}</span>
                                    </div>
                                    
                                    <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <span class="text-gray-300 font-medium">${i18n.t('chat.date')}:</span>
                                        <span class="text-xs text-gray-200 font-medium">${formattedDate}</span>
                                    </div>
                                    
                                    <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                        <span class="text-gray-300 font-medium">${i18n.t('chat.status')}:</span>
                                        <span class="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-green-100 font-medium shadow-lg">
                                            ${game.status?.toUpperCase() || 'COMPLETED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error(`Failed to fetch participants for game ${game.id}`, err);
                    return '';
                }
            })
        );

        // ✅ Fix 8: Filter out empty cards
        allGameCards = gameCards.filter(Boolean);
        container.innerHTML = allGameCards.join('');

        // ✅ Fix 9: Update stats preview
        updateUserStatsPreview(totalGames, totalWins, totalLosses);

    } catch (err) {
        console.error("Error fetching user games:", err);
        const container = document.getElementById("user-games");
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <div class="relative inline-block mb-6">
                        <div class="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full opacity-50 blur-lg"></div>
                        <svg class="relative w-16 h-16 mx-auto text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h4 class="text-xl font-bold bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent mb-2">${i18n.t('game.failedToLoadGames')}</h4>
                    <p class="text-gray-400 text-lg">${i18n.t('game.tryAgainLater')}</p>
                </div>
            `;
        }
        updateUserStatsPreview(0, 0, 0);
    }
}


function updateUserStatsPreview(totalGames: number, totalWins: number, totalLosses: number) {
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    const totalGamesEl = document.getElementById('total-games-preview');
    const totalWinsEl = document.getElementById('total-wins-preview');
    const winRateEl = document.getElementById('win-rate-preview');

    if (totalGamesEl) totalGamesEl.textContent = totalGames.toString();
    if (totalWinsEl) totalWinsEl.textContent = totalWins.toString();
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
}



function updateUserStats(totalGames: number, totalWins: number, totalLosses: number) {
    const totalGamesEl = document.getElementById('total-games-stat');
    const totalWinsEl = document.getElementById('total-wins-stat');
    const totalLossesEl = document.getElementById('total-losses-stat');

    if (totalGamesEl) totalGamesEl.textContent = totalGames.toString();
    if (totalWinsEl) totalWinsEl.textContent = totalWins.toString();
    if (totalLossesEl) totalLossesEl.textContent = totalLosses.toString();
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return i18n.t('time.justNow');
    if (diffMins < 60) return `${diffMins}${i18n.t('time.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours}${i18n.t('time.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}${i18n.t('time.daysAgo')}`;
    return date.toLocaleDateString();
}

function showErrorPage() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('profile.unableToLoad')}</h2>
                <p class="text-gray-600 mb-8">${i18n.t('profile.couldNotRetrieve')}</p>
                <button onclick="navigateTo('/chat')" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                    ${i18n.t('chat.returnToChat')}
                </button>
            </div>
        </div>
    `;
}


export function startGameWithFriend() {
    if (!selectedFriend) {
        console.error('No friend selected');
        showModalNotification('error', i18n.t('game.noFriendSelected'));
        return;
    }

    const confirmed = confirm(
        `${i18n.t('game.startGameConfirm')} ${selectedFriend.fullName}?\n\n` +
        i18n.t('game.willSendInvitation')
    );

    if (!confirmed) return;

    try {
        showModalNotification('info', `${i18n.t('game.sendingInvitation')} ${selectedFriend.fullName}...`);
        if (!socketNotification) return;

        socketNotification.emit('playWithFriend', selectedFriend);
        console.log('==============send playWithFriend to server===============');
        socketNotification.on('proposal', (data: any) => {
            if (data === 'accepted') {
                console.log("=========proposal accepted=========");
                online('friend', '/chat');
            }
        })

    } catch (error) {
        console.error('Error starting game with friend:', error);
        showModalNotification('error', i18n.t('game.failedToSendInvitation'));
    }
}


async function showNotificationDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'notification-dropdown';
    dropdown.className = 'absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50';

    dropdown.innerHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-semibold">${i18n.t('notifications.title')}</h3>
                <button id="clear-all-notifications" class="text-sm text-blue-600 hover:text-blue-800">${i18n.t('notifications.clearAll')}</button>
            </div>
            <div id="notification-list" class="max-h-60 overflow-y-auto">
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="text-sm text-gray-500 mt-2">Loading notifications...</p>
                </div>
            </div>
        </div>
    `;

    const existing = document.getElementById('notification-dropdown');
    if (existing) existing.remove();
    const chatHeader = document.getElementById('chat-header');
    if (chatHeader) {
        chatHeader.style.position = 'relative';
        chatHeader.appendChild(dropdown);
    }
    try {

        const response = await api.getNotifications();
        const notificationList = document.getElementById('notification-list');

        if (notificationList) {
            if (response.success && response.notifs!.length > 0) {
                notificationList.innerHTML = await notificationService.generateNotificationListFromAPI(response.notifs!);

                notificationList.querySelectorAll('[data-notification-id]').forEach(item => {
                    item.addEventListener('click', (e) => {
                        const notificationId = (e.currentTarget as HTMLElement).getAttribute('data-notification-id');
                        const senderId = (e.currentTarget as HTMLElement).getAttribute('data-sender-id');
                        if (senderId) {
                            selectFriend(senderId, globalFriendUsers);
                            dropdown.remove();
                        }
                    });
                });
            } else {
                notificationList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"/>
                        </svg>
                        <p class="text-sm">No new notifications</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        const notificationList = document.getElementById('notification-list');
        if (notificationList) {
            notificationList.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-sm">${i18n.t('notifications.failedToLoad')}</p>
                    <button class="mt-2 text-xs text-blue-600 hover:text-blue-800" onclick="showNotificationDropdown()">${i18n.t('notifications.tryAgain')}</button>
                </div>
            `;
        }
    }

    const clearAllBtn = document.getElementById('clear-all-notifications');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            notificationService.clearAllNotifications();
            dropdown.remove();
        });
    }

    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target as Node)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}






function showModalNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
    const notificationArea = document.getElementById('modal-notification-area');
    const notification = document.getElementById('modal-notification');
    const iconElement = document.getElementById('notification-icon');
    const messageElement = document.getElementById('notification-message');

    if (!notificationArea || !notification || !iconElement || !messageElement) {
        console.error(i18n.t('notifications.elementsNotFound'));
        return;
    }

    notification.className = 'p-3 rounded-xl flex items-center space-x-2 text-sm';

    let bgColor, textColor, borderColor, icon;

    switch (type) {
        case 'success':
            bgColor = 'bg-green-50';
            textColor = 'text-green-800';
            borderColor = 'border-green-200';
            icon = `
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
            break;
        case 'error':
            bgColor = 'bg-red-50';
            textColor = 'text-red-800';
            borderColor = 'border-red-200';
            icon = `
                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
            break;
        case 'warning':
            bgColor = 'bg-yellow-50';
            textColor = 'text-yellow-800';
            borderColor = 'border-yellow-200';
            icon = `
                <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
            `;
            break;
        case 'info':
            bgColor = 'bg-blue-50';
            textColor = 'text-blue-800';
            borderColor = 'border-blue-200';
            icon = `
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
            break;
    }

    notification.className += ` ${bgColor} ${textColor} ${borderColor} border`;
    iconElement.innerHTML = icon;
    messageElement.textContent = message;

    notificationArea.classList.remove('hidden');

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            hideModalNotification();
        }, 5000);
    }
}


function hideModalNotification() {
    const notificationArea = document.getElementById('modal-notification-area');
    if (notificationArea) {
        notificationArea.classList.add('hidden');
    }
}



function updateSearchStats(query: string, resultCount: number) {
    const searchStats = document.getElementById('search-stats');
    if (searchStats) {
        if (!query) {
            searchStats.textContent = i18n.t('search.readyToSearch');
        } else if (resultCount === 0) {
            searchStats.textContent = i18n.t('search.noResults') + ` "${query}"`;
        } else {
            searchStats.textContent = `${resultCount} ${i18n.t('search.result')}${resultCount > 1 ? i18n.t('search.pluralSuffix') : ''} ${i18n.t('search.for')} "${query}"`;
        }
    }
}


function showSearchLoading() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="relative mb-4">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                </div>
                <h4 class="font-semibold text-gray-700 mb-2">${i18n.t('search.searchingUsers')}</h4>
                <p class="text-sm text-gray-500">${i18n.t('search.findingMatches')}</p>
            </div>
        `;
    }
}

function hideSearchLoading() {
    // Loading state is handled by displaySearchResults or clearSearchResults
}

function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    const searchInput = document.getElementById('search-user-input') as HTMLInputElement;

    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500 text-sm">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p>${i18n.t('search.searchForUsers')}</p>
            </div>
        `;
    }

    if (searchInput) {
        searchInput.value = '';
    }

    updateSearchStats('', 0);
}