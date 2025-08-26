import { logout, isLoggedIn, getAccessToken, getRefreshToken } from '../utils/auth';
import { navigateTo } from '../utils/router';
import io from 'socket.io-client';
import { api } from '@/services/api';
import { getCurrentUser } from '@/utils/authState';
import { Message } from "@/types/message";
import { notificationService } from '../services/notificationService';
import { NotificationDropdown } from '../components/NotificationDropdown';

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
let onlineUsers: string[] = [];
let messageInput: HTMLTextAreaElement;
let notificationCounts: { [friendId: string]: number } = {};
let totalNotifications = 0;
let notificationSound: HTMLAudioElement | null = null;
let receiverSocketId: string | null = null;
let selectedFriend: any = null;
let globalFriendUsers: any[] = [];
let isSocketSetup = false;
let isEventsSetup = false;
let isSending = false;

let socket = io('http://localhost', { //**********************//
    auth: {
        token: getAccessToken()
    },
    transports: ['websocket', 'polling']
});

/**
 * Initializes the chat application and renders the chat interface
 * Checks user authentication before proceeding
 */
export async function initChat() {
    if (!isLoggedIn()) {
        navigateTo('/');
        return;
    }
    renderChat();
}

/**
 * Renders the complete chat interface including friend list and chat area
 * Fetches friends, sets up UI components, and initializes socket connections
 */
async function renderChat() {
    const app = document.getElementById("app");
    if (!app) return;

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
    <div class="chat-container flex h-screen">
      <div id="users-box" class="w-1/4 bg-gray-100 border-r border-gray-300 flex flex-col">
          <div class="p-4 border-b border-gray-200 bg-white">
           <div class="flex items-center justify-between mb-3">
                  <h2 class="text-lg font-semibold text-gray-800">Friends</h2>
                  <button id="notification-toggle-sidebar" class="relative p-2 text-gray-600 hover:text-blue-600 transition duration-200 rounded-full hover:bg-blue-50">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.5-3.5a5.5 5.5 0 000-7L19 4h-5m-9 9.5a5.5 5.5 0 007 0M5 17h5m-3.5-3.5L5 15l1.5-1.5"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.73 21a2 2 0 01-3.46 0"/>
                      </svg>
                      ${totalNotifications > 0 ? `
                          <div class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                              ${totalNotifications > 99 ? '99+' : totalNotifications}
                          </div>
                      ` : ''}
                  </button>
              </div>
              <button id="add-user-btn" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>Add Friend</span>
              </button>
          </div>
          
          <div id="user-list" class="user-list overflow-y-auto flex-1 p-4 space-y-2"></div>
      </div>

      <div class="main flex-1 flex flex-col">
          <div id="chat-header" class="p-4 bg-white shadow border-b border-gray-200">
            <p class="text-gray-700">Select a user to start chatting</p>
          </div>

          <div class="message-area flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            <ul id="message-container" class="message-container space-y-2"></ul>
            <div id="typing-indicator" class="mt-2 text-sm text-gray-500 italic"></div>
          </div>

          <div id="message-form-container" class="border-t border-gray-200"></div>
      </div>
    </div>
    
    <div id="add-user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-white rounded-lg p-6 w-96 max-w-md mx-4 max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                    Add Friend
                </h3>
                <button id="close-modal-btn" class="text-gray-500 hover:text-gray-700 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            
            <div id="modal-notification-area" class="mb-4 hidden">
                <div id="modal-notification" class="p-3 rounded-lg flex items-center space-x-2">
                    <div id="notification-icon" class="flex-shrink-0"></div>
                    <div id="notification-message" class="text-sm font-medium"></div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input 
                        type="text" 
                        id="search-user-input" 
                        placeholder="Search users by name or email..." 
                        class="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
            
            <div id="search-results" class="flex-1 max-h-60 overflow-y-auto space-y-2">
                <div class="text-center py-8 text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <p class="text-sm">Search for users to add as friends</p>
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span id="search-stats">Ready to search</span>
                    <div class="flex items-center space-x-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                        </svg>
                        <span id="friend-count">${globalFriendUsers.length} friends</span>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
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
            class="user-item bg-white rounded-lg p-3 shadow-sm flex items-center justify-between w-full text-left cursor-pointer hover:bg-blue-50 transition-all duration-200 ${unreadCount > 0 ? 'ring-2 ring-blue-300 bg-blue-50' : ''}"
            data-friend-id="${friendUser?.id}">
            <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${friendUser?.picture || ''}" alt="${friendUser?.fullName || 'USER'}" class="w-10 h-10 rounded-full object-cover">
                    <!-- ✅ Friend list status dot with green/red -->
                    <div class="absolute bottom-0 right-0 w-3 h-3 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'} border-2 border-white rounded-full"></div>
                    ${unreadCount > 0 ? `
                        <div class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                            ${unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    ` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <span class="font-medium text-gray-900 ${unreadCount > 0 ? 'font-bold' : ''} truncate block">${friendUser?.fullName || 'Unknown'}</span>
                    
                    </div>
                </div>
            </div>
            <!-- ... rest of your HTML remains the same -->
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
        userList.innerHTML = `<div class="text-gray-500">No friends found.</div>`;
    }

    if (!socket.connected) {
        socket.connect();
    }
    setupSocketConnection();
    setupChatEvents();
    setupAddUserModal();
    setupSidebarNotificationEvents();
    setupSidebarNotificationEventsAlternative();
    selectedFriend = null;
    clearMessageForm();
}

/**
 * Alternative setup using event delegation
 */
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

// Replace or add this call in renderChat
setupSidebarNotificationEventsAlternative();




/**
 * Sets up event listener for the sidebar notification button
 */

function setupSidebarNotificationEvents() {
    setTimeout(() => {
        console.log("Setting up sidebar notification events...");
        const notificationToggle = document.getElementById('notification-toggle-sidebar');

        if (notificationToggle) {
            // Remove any existing listeners
            const newButton = notificationToggle.cloneNode(true) as HTMLElement;
            notificationToggle.parentNode?.replaceChild(newButton, notificationToggle);

            newButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('🔔 Notification button clicked');
                await showSidebarNotificationDropdown();
            });
        } else {
            console.error('❌ Notification button not found');
        }
    }, 500);
}
/**
 * Shows notification dropdown specifically positioned for the sidebar
 */
/**
 * Shows notification dropdown specifically positioned for the sidebar
 */
async function showSidebarNotificationDropdown() {

    // Remove existing dropdown first
    const existing = document.getElementById('sidebar-notification-dropdown');
    if (existing) {
        existing.remove();
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'sidebar-notification-dropdown';

    // ✅ Fix: Use fixed positioning with precise coordinates
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
                    <p class="text-sm text-gray-500 mt-2">Loading notifications...</p>
                </div>
            </div>
        </div>
    `;

    // ✅ Append to body for better positioning control
    document.body.appendChild(dropdown);

    try {
        // Fetch notifications from API
        const response = await api.getNotifications();
        const notificationList = document.getElementById('sidebar-notification-list');

        if (notificationList) {
            if (response.success && response.notifs && response.notifs.length > 0) {
                // Generate notification list HTML
                const notificationHTML = await Promise.all(
                    response.notifs.map(async (notif: any) => {
                        try {
                            // Get sender info
                            const senderResponse = await api.getuserbyid(notif.senderId || notif.user1ID);
                            const senderName = senderResponse.user?.fullName || 'Unknown User';
                            const senderPicture = senderResponse.user?.picture || '';

                            return `
                                <div class="notification-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100" 
                                     data-notification-id="${notif.id}" 
                                     data-sender-id="${notif.senderId || notif.user1ID}">
                                    <div class="flex items-start space-x-3">
                                        <img src="${senderPicture}" alt="${senderName}" class="w-8 h-8 rounded-full">
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">${senderName}</p>
                                            <p class="text-sm text-gray-600">${notif.content || notif.message || 'New message'}</p>
                                            <p class="text-xs text-gray-400 mt-1">
                                                ${new Date(notif.createdAt || notif.sentAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
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

                // Add click handlers for notification items
                notificationList.querySelectorAll('.notification-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        const senderId = (e.currentTarget as HTMLElement).getAttribute('data-sender-id');
                        if (senderId) {
                            console.log('🔔 Clicking notification, selecting friend:', senderId);
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

        // Add clear all handler
        const clearAllBtn = document.getElementById('clear-all-notifications-sidebar');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', async () => {
                try {
                    // Show loading state
                    clearAllBtn.textContent = 'Clearing...';
                    clearAllBtn.setAttribute('disabled', 'true');

                    // Clear on server (optional)
                    try {
                        await api.clearAllNotifications();
                    } catch (apiError) {
                        console.warn('Could not clear notifications on server:', apiError);
                    }

                    // Clear local notifications
                    notificationService.clearAllNotifications();

                    // Clear notification counts
                    totalNotifications = 0;
                    notificationCounts = {};

                    // Update the dropdown to show empty state
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

                    // Close dropdown after showing success
                    setTimeout(() => {
                        dropdown.remove();
                    }, 1500);

                    // Re-render the sidebar to update notification badge
                    // setTimeout(() => {
                    //     renderChat();
                    // }, 200);

                    console.log('✅ All notifications cleared successfully');

                } catch (error) {
                    console.error('Error clearing notifications:', error);
                    showModalNotification('error', '❌ Failed to clear notifications');

                    // Reset button state
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

    // Add click outside to close
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

/**
 * Sets up WebSocket connection and event listeners for real-time communication
 * Handles connection events, authentication, and message receiving
 */
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

    socket.on('users-online', (data: { userIds: string[] }) => {
        updateOnlineUsers(data.userIds);
    });

    socket.on('user-status-changed', (data: { userId: string; status: 'online' | 'offline' }) => {
        if (data.status === 'online') {
            if (!onlineUsers.includes(data.userId)) {
                onlineUsers.push(data.userId);
            }
        } else {
            onlineUsers = onlineUsers.filter(id => id !== data.userId);
        }

        updateFriendListOnlineStatus();

        if (selectedFriend && selectedFriend.id === data.userId) {
            updateChatHeaderForFriend(selectedFriend);
        }
    });

    socket.on('connect_error', async (err: Error & { message: string }) => {
        console.error('🔌 Socket connection error:', err);
        if (err.message === 'Authentication error') {
            try {
                const newToken = getRefreshToken();
                (socket as any).auth.token = newToken;
                socket.connect();
            } catch (refreshError) {
                logout();
                navigateTo('/login');
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

    socket.on('message-sent-success', (messageData: { receiverId: string; content: string; sentAt: string }) => {
        if (selectedFriend && messageData.receiverId === selectedFriend.id) {
            const displayData: MessageData = {
                name: 'You',
                message: messageData.content,
                dateTime: new Date(messageData.sentAt)
            };
            addMessageToUI(true, displayData);
        }
    });

    socket.on('friend-request-received', (data: any) => {
        notificationService.showFriendRequestAlert(data);
        notificationService.playNotificationSound();

        if (Notification.permission === 'granted') {
            new Notification(`🤝 Friend Request from ${data.senderName}`, {
                body: 'Click to accept or reject',
                icon: data.senderPicture || '/favicon.ico'
            });
        }
    });

    socket.on('friend-request-accepted', (data: { friendName: string }) => {
        showModalNotification('success', `🎉 ${data.friendName} accepted your friend request!`);
        // Refresh friend list
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    });

    socket.on('friend-request-rejected', (data: { friendName: string }) => {
        showModalNotification('info', `${data.friendName} declined your friend request.`);
    });

    socket.on('message-sent-error', (error: unknown) => {
        console.error('❌ Failed to send message:', error);
    });
}

// Add this debug function to see what's happening with online status


// Call this in browser console to debug
// window.debugOnlineStatus = debugOnlineStatus;

/**
 * Handles incoming private messages from WebSocket
 * Updates UI for current conversation or creates notifications for other conversations
 */
function handleNewPrivateMessage(messageData: any) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (selectedFriend && (messageData.senderId === selectedFriend.id || messageData.receiverId === selectedFriend.id)) {
        // Handle current conversation message
        const isOwnMessage = messageData.senderId === currentUser.id;
        const displayData = {
            name: isOwnMessage ? 'You' : messageData.senderName,
            message: messageData.content,
            dateTime: new Date(messageData.sentAt)
        };
        addMessageToUI(isOwnMessage, displayData);
    } else if (messageData.senderId !== currentUser.id) {
        // Use notification service for other conversations
        notificationService.addNotification(messageData.senderId, messageData);
    }
}

/**
 * Returns the global array of friend users for notification and UI purposes
 */
function getCurrentFriendUsers(): any[] {
    return globalFriendUsers || [];
}


function setupChatEvents() {
    if (isEventsSetup) return;
    isEventsSetup = true;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            navigateTo('/login');
        });
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            socket.emit('request-user-list');
        });
    }

    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    if (messageForm) {
        const newForm = messageForm.cloneNode(true) as HTMLFormElement;
        messageForm.parentNode?.replaceChild(newForm, messageForm);

        newForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            sendMessage();
        });
    }

    messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
}

/**
 * Sets up modal functionality for adding new friends
 * Handles modal open/close and search input events
 */
function setupAddUserModal() {
    const addUserBtn = document.getElementById('add-user-btn');
    const modal = document.getElementById('add-user-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const searchInput = document.getElementById('search-user-input') as HTMLInputElement;

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.remove('hidden');
                hideModalNotification();
                updateSearchStats('', 0);
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.add('hidden');
                clearSearchResults();
                hideModalNotification();
            }
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                clearSearchResults();
                hideModalNotification();
            }
        });
    }

    if (searchInput) {
        let searchTimeout: number;

        searchInput.addEventListener('focus', () => {
            searchUsers('');
        });

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = (e.target as HTMLInputElement).value.trim();
            hideModalNotification();
            searchTimeout = window.setTimeout(() => {
                searchUsers(query);
            }, 300);
        });
    }
}

/**
 * Searches for users to add as friends
 * Filters out current user and existing friends from results
 */
async function searchUsers(query: string) {
    try {
        showModalNotification('info', 'Searching users...');

        const response = await api.getAllUsers();

        const currentUser = getCurrentUser();
        if (!currentUser) {
            showModalNotification('error', 'User session expired. Please log in again.');
            return;
        }

        const friendsResponse = await api.readFriendList();
        const existingFriends = friendsResponse.friendship || [];
        const friendIds = existingFriends.map((friend: any) =>
            friend.user1ID === currentUser.id ? friend.user2ID : friend.user1ID
        );

        let users = response.users || [];
        users = users.filter((user: any) =>
            user.id !== currentUser.id && !friendIds.includes(user.id)
        );

        if (query) {
            users = users.filter((user: any) =>
                user.fullName?.toLowerCase().includes(query.toLowerCase()) ||
                user.email?.toLowerCase().includes(query.toLowerCase())
            );
        }

        updateSearchStats(query, users.length);
        hideModalNotification();

        if (users.length === 0 && query) {
            showModalNotification('warning', `No users found matching "${query}"`);
        }

        displaySearchResults(users);
    } catch (error) {
        console.error('Error searching users:', error);
        showModalNotification('error', 'Failed to search users. Please try again.');
        updateSearchStats(query, 0);
    }
}

/**
 * Displays search results in the modal with add friend buttons
 */
function displaySearchResults(users: any[]) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (users.length === 0) {
        resultsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No users found</p>';
        return;
    }

    resultsContainer.innerHTML = users.map(user => `
        <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
            <div class="flex items-center space-x-3">
                <img src="${user.picture || 'user-avatar.png'}" alt="${user.fullName}" class="w-10 h-10 rounded-full">
                <div>
                    <p class="font-medium">${user.fullName || 'Unknown'}</p>
                    <p class="text-sm text-gray-500">${user.email || ''}</p>
                </div>
            </div>
            <button 
                class="add-friend-btn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-sm"
                data-user-id="${user.id}"
            >
                Add Friend
            </button>
        </div>
    `).join('');

    resultsContainer.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = (e.target as HTMLElement).getAttribute('data-user-id');
            if (userId) {
                await addFriend(userId, e.target as HTMLElement);
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

                // Filter out own requests first
                const validRequests = pendingRequests.filter(req =>
                    req.user1ID !== currentUser?.id
                );

                // Process all requests simultaneously
                const requestPromises = validRequests.map(async (req) => {
                    try {
                        const usersender = await api.getuserbyid(req.user1ID);

                        return {
                            id: req.id,
                            senderId: req.user1ID,
                            senderName: usersender.user?.fullName || req.senderName || 'Unknown',
                            senderPicture: usersender.user?.picture || req.senderPicture || '',
                            createdAt: req.createdAt || new Date().toISOString()
                        };
                    } catch (userError) {
                        console.error('Error fetching sender info for:', req.user1ID, userError);

                        return {
                            id: req.id,
                            senderId: req.user1ID,
                            senderName: req.senderName || 'Unknown',
                            senderPicture: req.senderPicture || '',
                            createdAt: req.createdAt || new Date().toISOString()
                        };
                    }
                });

                // Wait for all user data to be fetched
                const processedRequests = await Promise.all(requestPromises);

                // Show alerts for all processed requests
                processedRequests.forEach(requestData => {
                    console.log('🔔 Showing alert for request from:', requestData.senderName);
                    notificationService.showFriendRequestAlert(requestData);
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


async function addFriend(friendId: string, buttonElement: HTMLElement) {
    try {
        buttonElement.textContent = 'Adding...';
        buttonElement.setAttribute('disabled', 'true');

        showModalNotification('info', 'Sending friend request...');

        const response = await api.addFriend(friendId);

        if (response.success) {
            const friendResponse = await api.getuserbyid(friendId);
            const friendName = friendResponse.user?.fullName || 'Unknown User';
            const currentUser = getCurrentUser();

            // Send notification through API
            await sendFriendRequestNotification(friendId, friendName);

            // Emit socket event for real-time alert
            socket.emit('send-friend-request', {
                receiverId: friendId,
                requestId: response.friendshipId || response.id, // Adjust based on your API response
                senderName: currentUser?.fullName,
                senderPicture: currentUser?.picture
            });

            buttonElement.textContent = '✓ Request Sent!';
            buttonElement.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            buttonElement.classList.add('bg-green-600');

            showModalNotification('success', `Friend request sent to ${friendName}! 🚀`);

            setTimeout(() => {
                const modal = document.getElementById('add-user-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    clearSearchResults();
                }
            }, 2000);
        } else {
            throw new Error(response.message || 'Failed to send friend request');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
        buttonElement.textContent = '✗ Failed';
        buttonElement.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        buttonElement.classList.add('bg-red-600');

        showModalNotification('error', 'Failed to send friend request. Please try again.');

        setTimeout(() => {
            buttonElement.textContent = 'Add Friend';
            buttonElement.classList.remove('bg-red-600');
            buttonElement.classList.add('bg-blue-600', 'hover:bg-blue-700');
            buttonElement.removeAttribute('disabled');
        }, 3000);
    }
}

/**
 * Sends a friend request notification to the target user
 */
async function sendFriendRequestNotification(friendId: string, friendName: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const response = await api.sendNotification(
            `${currentUser.fullName} sent you a friend request!`,
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

/**
 * Clears search results and input field in the add user modal
 */
function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    const searchInput = document.getElementById('search-user-input') as HTMLInputElement;

    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    if (searchInput) {
        searchInput.value = '';
    }
}

/**
 * Selects a friend for conversation and updates the chat interface
 * Clears notifications for the selected friend and loads conversation history
 */
function selectFriend(friendId: string | null, friendUsers: any[]) {
    if (!friendId) return;

    const friend = friendUsers.find(friend => friend?.id === friendId);
    selectedFriend = friend;
    receiverSocketId = friendId;

    if (!selectedFriend) {
        console.error('Friend not found');
        return;
    }
    notificationService.clearNotificationsForFriend(friendId);

    if (notificationCounts[friendId]) {
        totalNotifications -= notificationCounts[friendId];
        notificationCounts[friendId] = 0;
    }

    createMessageForm();

    updateChatHeaderForFriend(selectedFriend);
    loadConversationWithFriend(friendId);
}


/**
 * Removes the message form from the chat interface
 */
function clearMessageForm() {
    const messageFormContainer = document.getElementById('message-form-container');
    if (messageFormContainer) {
        messageFormContainer.innerHTML = `
            <div class="p-4 bg-gray-100 border-t border-gray-200 text-center">
                <p class="text-gray-500 text-sm">Select a friend to start messaging</p>
            </div>
        `;
    }
    messageInput = null as any;
}

/**
 * Creates and adds the message form to the chat interface
 */
function createMessageForm() {
    const messageFormContainer = document.getElementById('message-form-container');
    if (!messageFormContainer) return;

    // ✅ Use textarea instead of input for multi-line support
    messageFormContainer.innerHTML = `
        <form id="message-form" class="flex items-end p-4 bg-white space-x-2">
            <textarea
                name="message"
                id="message-input"
                class="message-input flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none min-h-[40px] max-h-[120px]"
                placeholder="Type a message..."
                autocomplete="off"
                rows="1"
            ></textarea>
            <button
                type="submit"
                class="send-button px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 self-end"
            >
                <span>Send</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
            </button>
        </form>
    `;

    // ✅ Add event listener to the form
    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    if (messageForm) {
        messageForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // ✅ Update messageInput reference and add special key handling
    messageInput = document.getElementById('message-input') as HTMLTextAreaElement;

    if (messageInput) {
        messageInput.disabled = false;
        messageInput.focus();

        // ✅ Handle Enter key for new lines and Shift+Enter for sending
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Shift+Enter sends the message
                    e.preventDefault();
                    sendMessage();
                } else {
                    // Regular Enter adds new line (default behavior)
                    // Also auto-resize the textarea
                    setTimeout(() => autoResizeTextarea(messageInput), 0);
                }
            }
        });

        // ✅ Auto-resize functionality
        messageInput.addEventListener('input', () => autoResizeTextarea(messageInput));
    }

    const sendButton = document.querySelector('.send-button') as HTMLButtonElement;
    if (sendButton) {
        sendButton.disabled = false;
    }
}

/**
 * Auto-resizes textarea based on content
 */
function autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px height
    textarea.style.height = newHeight + 'px';
}

async function loadConversationWithFriend(friendId: string) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id || !friendId) return;

    messageContainer = document.getElementById('message-container') as HTMLElement;
    messageContainer.innerHTML = '';

    try {
        const messages = await api.getConversationMessages(currentUser.id, friendId);

        if (messages && messages.length > 0) {
            const sortedMessages = [...messages].reverse();

            sortedMessages.forEach((msg: Message) => {
                const isOwnMessage = msg.senderId === currentUser.id;
                const messageData: MessageData = {
                    name: isOwnMessage ? `You` : selectedFriend?.fullName || 'Friend',
                    message: msg.content,
                    dateTime: new Date(msg.sentAt || Date.now())
                };
                addMessageToUI(isOwnMessage, messageData);
            });
        } else {
            console.log('No messages found in this conversation');
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        if (error instanceof Error && (error.message.includes('404') || error.message.includes('There is no conversation'))) {
            console.log('No conversation found between these users yet - starting fresh conversation');
        } else {
            console.error('Unexpected error loading conversation:', error);
        }
    }
}


function getOnlineStatus(userId: string): boolean {
    return onlineUsers.includes(userId);
}

function updateOnlineUsers(userIds: string[]) {
    console.log('🔄 Updating online users:', userIds);
    onlineUsers = [...userIds];

    // Update friend list display
    updateFriendListOnlineStatus();

    // Update chat header if a friend is selected
    if (selectedFriend) {
        updateChatHeaderForFriend(selectedFriend);
    }
}

function updateFriendListOnlineStatus() {
    const userItems = document.querySelectorAll('.user-item');

    userItems.forEach(item => {
        const friendId = item.getAttribute('data-friend-id');
        if (!friendId) return;

        const isOnline = getOnlineStatus(friendId);

        // Update profile picture status dot
        const statusDots = item.querySelectorAll('.absolute.bottom-0.right-0');
        statusDots.forEach(statusDot => {
            if (statusDot.classList.contains('w-3') && statusDot.classList.contains('h-3')) {
                statusDot.className = `absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`;
            }
        });
    });
}


function updateChatHeaderForFriend(friend: any) {
    const chatHeader = document.getElementById('chat-header');
    if (!chatHeader) return;

    if (!friend) {
        chatHeader.innerHTML = '<p class="text-gray-700">Select a user to start chatting</p>';
        clearMessageForm();
        return;
    }

    const unreadCount = notificationCounts[friend.id] || 0;
    // ✅ Add online status check
    const isOnline = getOnlineStatus(friend.id);

    chatHeader.innerHTML = `
        <div class="chat-user-info flex items-center justify-between w-full">
            <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${friend?.picture || 'user-avatar.png'}" alt="${friend?.fullName}" class="w-10 h-10 rounded-full">
                    <!-- ✅ Fixed status dot with online/offline colors -->
                    <div class="absolute bottom-0 right-0 w-3 h-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'} border-2 border-white rounded-full ${isOnline ? 'animate-pulse' : ''}"></div>
                </div>
                <div>
                    <h3 class="font-semibold">${friend?.fullName}</h3>
                    <!-- ✅ Add status text -->
                    <p class="text-sm ${isOnline ? 'text-green-600' : 'text-red-600'} flex items-center">
                        <span class="w-2 h-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-1"></span>
                        ${isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
            
            <div class="flex items-center space-x-3">
                ${unreadCount > 0 ? `
                    <div class="flex items-center bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z"/>
                            <path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
                        </svg>
                        ${unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                ` : ''}
        
                <button id="chat-options" class="p-2 text-gray-600 hover:text-gray-800 transition duration-200 rounded-full hover:bg-gray-50">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    setupChatOptionsEvents();
}
/**
 * Sets up event listeners for chat option buttons in the header (notification button removed)
 */
async function setupChatOptionsEvents() {
    // Remove notification toggle setup since it's not in the header anymore

    const chatOptions = document.getElementById('chat-options');
    if (chatOptions) {
        chatOptions.addEventListener('click', () => {
            showChatOptionsMenu();
        });
    }
}

/**
 * Sets up event listeners for notification and chat option buttons in the header
 */
async function setupHeaderNotificationEvents() {
    const notificationToggle = document.getElementById('notification-toggle');
    if (notificationToggle) {
        notificationToggle.addEventListener('click', async () => {
            await showNotificationDropdown();
        });
    }

    const chatOptions = document.getElementById('chat-options');
    if (chatOptions) {
        chatOptions.addEventListener('click', () => {
            showChatOptionsMenu();
        });
    }
}


/**
 * Shows dropdown menu with chat options (clear, block, info, remove friend)
 */
function showChatOptionsMenu() {
    const dropdown = document.createElement('div');
    dropdown.id = 'chat-options-dropdown';
    dropdown.className = 'absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50';
    dropdown.innerHTML = `
        <div class="py-2">
            <button id="clear-chat-btn" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Clear Chat
            </button>
            <button id="block-user-btn" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                Block User
            </button>
            <button id="user-info-btn" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                User Info
            </button>
            <hr class="my-1">
            <button id="play-game-btn" class="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                🎮 Play Game
            </button>
        </div>
    `;

    const existing = document.getElementById('chat-options-dropdown');
    if (existing) existing.remove();

    const chatHeader = document.getElementById('chat-header');
    if (chatHeader) {
        chatHeader.style.position = 'relative';
        chatHeader.appendChild(dropdown);
    }

    setupChatOptionsHandlers(dropdown);

    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target as Node)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

/**
 * Sets up event handlers for chat options menu items
 */
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

/**
 * Clears all messages from the current chat conversation (both database and UI)
 */
async function clearCurrentChat() {
    if (!selectedFriend) {
        console.error('No friend selected');
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No current user found');
        return;
    }

    // Show confirmation dialog
    const confirmed = confirm(
        `Are you sure you want to clear all messages with ${selectedFriend.fullName}?\n\n` +
        `⚠️ This action will permanently delete all messages between you two and cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    try {
        // Show loading state
        const messageContainer = document.getElementById('message-container') as HTMLElement;
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-gray-600">Clearing conversation...</span>
                </div>
            `;
        }

        // Call API using the new route structure
        if (!currentUser.id || !selectedFriend.id) {
            throw new Error('User ID or Friend ID is missing');
        }
        const response = await api.clearConversation(currentUser.id, selectedFriend.id);
        if (response.success) {
            // Clear UI immediately
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-16 text-gray-500">
                        <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        <h3 class="text-lg font-medium text-gray-700 mb-2">Conversation cleared</h3>
                        <p class="text-sm text-center">All messages have been deleted.<br>Start a new conversation below!</p>
                    </div>
                `;
            }

            // Show success notification
            const deletedCount = response.deletedCount || 0;
            showModalNotification('success', `✅ Conversation cleared! ${deletedCount} messages deleted.`);

            // Optional: Emit socket event to notify the other user
            if (socket) {
                socket.emit('conversation-cleared', {
                    clearedBy: currentUser.id,
                    otherUser: selectedFriend.id,
                    clearedByName: currentUser.fullName
                });
            }

            console.log(`✅ Conversation cleared: ${response.message}`);

        } else {
            // Fix: Provide fallback for undefined message
            throw new Error(response.message || 'Failed to clear conversation');
        }

    } catch (error) {
        console.error('❌ Error clearing conversation2:', error);

        // Restore the conversation view by reloading it
        if (selectedFriend) {
            await loadConversationWithFriend(selectedFriend.id);
        }

        // Fix: Handle both Error objects and other types safely
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showModalNotification('error', `❌ Failed to clear conversation: ${errorMessage}`);

        alert(`Failed to clear conversation: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    }
}

/**
 * Blocks the currently selected friend (placeholder implementation)
 */
/**
 * Blocks the currently selected friend
 */
async function blockCurrentUser() {
    if (!selectedFriend) {
        console.error('No friend selected');
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to block ${selectedFriend.fullName}?\n\n` +
        `⚠️ This will prevent them from messaging you and hide them from your friend list.`
    );

    if (!confirmed) return;

    try {
        const response = await api.bockfrienduser(selectedFriend.id);
        console.log("responce of blockfrienduser: ", response);
        if (response.success) {
            showModalNotification('success', '✅ User blocked successfully!');

            // Remove from friend list UI
            const friendItem = document.querySelector(`[data-friend-id="${selectedFriend.id}"]`);
            if (friendItem) {
                friendItem.remove();
            }

            // Clear current chat
            selectedFriend = null;
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
                messageContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Select a friend to start chatting</p>';
            }

            // Update chat header
            const chatHeader = document.getElementById('chat-header');
            if (chatHeader) {
                chatHeader.innerHTML = '<p class="text-gray-700">Select a user to start chatting</p>';
            }
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        showModalNotification('error', '❌ Failed to block user');
    }
}
/**
 * Shows information about the currently selected friend
 */
function showUserInfo() {
    if (selectedFriend) {
        navigateTo('/dashboard');
    }
}

/**
 * Removes the currently selected friend (placeholder implementation)
 */
function startGameWithFriend() {
    if (!selectedFriend) {
        console.error('No friend selected');
        showModalNotification('error', '❌ No friend selected to play with');
        return;
    }

    const confirmed = confirm(
        `🎮 Start a game with ${selectedFriend.fullName}?\n\n` +
        `This will send them a game invitation!`
    );

    if (!confirmed) return;

    try {
        // Show loading notification
        showModalNotification('info', `🎮 Sending game invitation to ${selectedFriend.fullName}...`);

        // Emit socket event to invite friend to play
        if (socket) {
            const currentUser = getCurrentUser();
            socket.emit('game-invitation', {
                inviterId: currentUser?.id,
                inviterName: currentUser?.fullName,
                inviterPicture: currentUser?.picture,
                inviteeId: selectedFriend.id,
                inviteeName: selectedFriend.fullName,
                gameType: 'pong', // or whatever game type you have
                timestamp: new Date().toISOString()
            });
        }

        // Show success message
        showModalNotification('success', `🎮 Game invitation sent to ${selectedFriend.fullName}!`);

        // Optional: Navigate to game lobby or waiting screen
        setTimeout(() => {
            // You can navigate to a game page or show a waiting modal
            // navigateTo('/game/lobby');
            console.log('🎮 Game invitation sent successfully');
        }, 2000);

    } catch (error) {
        console.error('Error starting game with friend:', error);
        showModalNotification('error', '❌ Failed to send game invitation. Please try again.');
    }
}

/**
 * Shows dropdown with list of current notifications
 */
async function showNotificationDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'notification-dropdown';
    dropdown.className = 'absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50';

    dropdown.innerHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-semibold">Notifications</h3>
                <button id="clear-all-notifications" class="text-sm text-blue-600 hover:text-blue-800">Clear All</button>
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
        // Fetch notifications from API
        const response = await api.getNotifications();
        const notificationList = document.getElementById('notification-list');

        if (notificationList) {
            if (response.success && response.notifs!.length > 0) {
                notificationList.innerHTML = await notificationService.generateNotificationListFromAPI(response.notifs!);
                // Add click handlers for notification items
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
                    <p class="text-sm">Failed to load notifications</p>
                    <button class="mt-2 text-xs text-blue-600 hover:text-blue-800" onclick="showNotificationDropdown()">Try again</button>
                </div>
            `;
        }
    }

    // Add clear all handler
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



async function sendMessage() {
    if (isSending) return;
    isSending = true;

    messageContainer = document.getElementById('message-container') as HTMLElement;
    messageInput = document.getElementById('message-input') as HTMLTextAreaElement;

    if (!messageInput || !messageContainer || !selectedFriend) {
        isSending = false;
        return;
    }

    const messageText = messageInput.value.trim();
    if (messageText === '') {
        isSending = false;
        return;
    }

    try {
        const senderId = getCurrentUser()?.id;
        const senderName = getCurrentUser()?.fullName;

        if (!senderId || !senderName) {
            console.error('No sender info found');
            isSending = false;
            return;
        }

        messageInput.value = '';

        socket.emit('send-private-message', {
            senderId: senderId,
            receiverId: selectedFriend.id,
            content: messageText,
            senderName: senderName
        });


    } catch (err) {
        console.error('Failed to send message:', err);
        messageInput.value = messageText;
    } finally {
        isSending = false;
    }
}

/**
 * Adds a message to the chat UI with proper styling and timestamp
 */
function addMessageToUI(isOwnMessage: boolean, data: MessageData) {
    if (!messageContainer) return;

    // ✅ Convert line breaks to HTML breaks and escape HTML
    const formattedMessage = escapeHtml(data.message)
        .replace(/\n/g, '<br>')
        .replace(/\r\n/g, '<br>')
        .replace(/\r/g, '<br>');

    const messageHTML = `
        <li class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4">
            <div class="message-bubble max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }">
                <p class="message-text text-sm whitespace-pre-wrap break-words">${formattedMessage}</p>
                <div class="message-meta mt-1 text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} flex justify-between items-center">
                    <span class="message-sender font-medium">${data.name}</span>
                    <span class="message-time">${new Date(data.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </li>
    `;

    messageContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

/**
 * Escapes HTML characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Smoothly scrolls the message area to show the latest message
 */
function scrollToBottom() {
    const messageArea = document.querySelector('.message-area') as HTMLElement;
    if (messageArea) {
        messageArea.scrollTo({
            top: messageArea.scrollHeight,
            behavior: 'smooth'
        });
    }
}

/**
 * Shows notification message in the modal with appropriate styling and icon
 */
function showModalNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
    const notificationArea = document.getElementById('modal-notification-area');
    const notification = document.getElementById('modal-notification');
    const iconElement = document.getElementById('notification-icon');
    const messageElement = document.getElementById('notification-message');

    if (!notificationArea || !notification || !iconElement || !messageElement) return;

    notification.className = 'p-3 rounded-lg flex items-center space-x-2';

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

/**
 * Hides the modal notification area
 */
function hideModalNotification() {
    const notificationArea = document.getElementById('modal-notification-area');
    if (notificationArea) {
        notificationArea.classList.add('hidden');
    }
}

/**
 * Updates search statistics display in the modal footer
 */
function updateSearchStats(query: string, resultCount: number) {
    const searchStats = document.getElementById('search-stats');
    if (searchStats) {
        if (!query) {
            searchStats.textContent = 'Ready to search';
        } else if (resultCount === 0) {
            searchStats.textContent = `No results for "${query}"`;
        } else {
            searchStats.textContent = `${resultCount} result${resultCount > 1 ? 's' : ''} for "${query}"`;
        }
    }
}


document.addEventListener('DOMContentLoaded', initChat);