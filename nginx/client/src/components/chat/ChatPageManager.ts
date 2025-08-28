import { MessageList, MessageListProps } from './MessageList';
import { MessageInput, MessageInputProps } from './MessageInput';
import { Message, ConversationMessagesResponse } from '../../types/message';
import { User } from '../../types/user';
import { api } from '../../services/api';
import { getCurrentUser } from '../../utils/authState';
import { errorHandler, validateMessage, validateUser, handleNetworkError, handleSocketError } from './ErrorHandler';
import { showUserInfo, blockCurrentUser, startGameWithFriend } from '../../pages/ChatPage';
import { i18n } from '@/services/i18n';

export interface ChatPageManagerProps {
  selectedFriend: User | null;
  socket: any;
  onFriendSelect?: (friend: User) => void;
}

export class ChatPageManager {
  private container: HTMLElement;
  private props: ChatPageManagerProps;
  private messageList: MessageList | null = null;
  private messageInput: MessageInput | null = null;
  private messages: Message[] = [];
  private isLoading: boolean = false;
  private currentUser: User | null = null;
  private retryQueue: Message[] = [];
  private wasEverConnected = false;

  constructor(container: HTMLElement, props: ChatPageManagerProps) {
    this.container = container;
    this.props = props;
    this.currentUser = getCurrentUser();
    this.render();
    this.setupSocketListeners();
  }

  public updateProps(newProps: Partial<ChatPageManagerProps>) {
    const oldFriend = this.props.selectedFriend;
    this.props = { ...this.props, ...newProps };
    
    // If friend changed, load new conversation and update header
    if (oldFriend?.id !== this.props.selectedFriend?.id) {
      this.updateChatHeader();
      this.loadConversation();
    }
    
    // Update online status when props change
    this.updateFriendOnlineStatus();
  }

  public updateFriendOnlineStatus() {
    if (!this.props.selectedFriend) return;
    
    // Get online status from ChatPage's onlineUsers array
    const isOnline = (window as any).getOnlineStatus?.(this.props.selectedFriend.id) || false;
    
    const statusText = this.container.querySelector('#friend-status');
    const statusDot = this.container.querySelector('#friend-status-dot');
    
    if (statusText) {
      statusText.textContent = isOnline ? i18n.t('chat.online') : i18n.t('chat.offline');
    }
    
    if (statusDot) {
      statusDot.className = statusDot.className
        .replace(/bg-green-500|bg-red-500/g, '')
        .replace(/animate-pulse/g, '');
      
      if (isOnline) {
        statusDot.classList.add('bg-green-500', 'animate-pulse');
      } else {
        statusDot.classList.add('bg-red-500');
      }
    }
  }

  private updateChatHeader() {
    const headerContainer = this.container.querySelector('.flex-shrink-0.border-b.border-white\\/10.bg-black\\/20.backdrop-blur-sm');
    if (headerContainer) {
      headerContainer.innerHTML = this.renderChatHeader();
      this.setupHeaderEvents();
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <!-- Chat Header -->
        <div class="flex-shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          ${this.renderChatHeader()}
        </div>
        
        <!-- Messages Area -->
        <div class="flex-1 min-h-0 overflow-hidden" id="messages-container">
          ${this.props.selectedFriend ? '' : this.renderEmptyState()}
        </div>
        
        <!-- Message Input -->
        <div class="flex-shrink-0 border-t border-white/10 bg-black/10 backdrop-blur-sm" id="message-input-container">
          ${this.props.selectedFriend ? '' : ''}
        </div>
      </div>
    `;

    this.initializeComponents();
  }

  private renderChatHeader(): string {
    if (!this.props.selectedFriend) {
      return `
        <div class="p-4 text-center">
          <h2 class="text-lg font-semibold text-white">Select a friend to start chatting</h2>
        </div>
      `;
    }

    return `
      <div class="p-4">
        <div class="flex items-center space-x-3">
          <!-- Friend Avatar -->
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
              ${this.props.selectedFriend.fullName ? this.props.selectedFriend.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div id="friend-status-dot" class="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>
          </div>
          
          <!-- Friend Info -->
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-semibold text-white truncate">
              ${this.props.selectedFriend.fullName || 'Unknown User'}
            </h2>
            <p id="friend-status" class="text-sm text-white/60">${i18n.t('chat.offline')}</p>
          </div>
          
          <!-- Chat Options -->
          <div class="flex items-center space-x-2">
            
            <button 
              id="chat-info-btn"
              class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Chat info"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderEmptyState(): string {
    return `
      <div class="flex flex-col items-center justify-center h-full text-center px-8 py-12">
        <!-- Animated Chat Icon -->
        <div class="relative mb-8">
          <div class="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
            <svg class="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <!-- Floating dots animation -->
          <div class="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
        </div>
        
        <!-- Welcome Content -->
        <div class="max-w-md space-y-4">
          <h3 class="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to Chat
          </h3>
          <p class="text-white/70 text-lg leading-relaxed">
            Select a friend from the sidebar to start a conversation
          </p>
          <div class="flex flex-col space-y-3 mt-6 text-sm text-white/50">
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span>Real-time messaging</span>
            </div>
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span>Message validation & safety</span>
            </div>
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span>Automatic retry on connection issues</span>
            </div>
          </div>
        </div>
        
        <!-- Subtle background pattern -->
        <div class="absolute inset-0 opacity-5 pointer-events-none">
          <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div class="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </div>
    `;
  }

  private initializeComponents() {
    if (!this.props.selectedFriend || !this.currentUser) return;

    // Initialize MessageList
    const messagesContainer = this.container.querySelector('#messages-container');
    if (messagesContainer) {
      const messageListProps: MessageListProps = {
        messages: this.messages,
        currentUser: this.currentUser,
        onLoadMore: this.loadMoreMessages.bind(this),
        isLoading: this.isLoading
      };
      this.messageList = new MessageList(messagesContainer as HTMLElement, messageListProps);
    }

    // Initialize MessageInput
    const inputContainer = this.container.querySelector('#message-input-container');
    if (inputContainer) {
      const messageInputProps: MessageInputProps = {
        onSendMessage: this.sendMessage.bind(this),
        placeholder: `Message ${this.props.selectedFriend.fullName}...`,
        disabled: false,
        maxLength: 1000
      };
      this.messageInput = new MessageInput(inputContainer as HTMLElement, messageInputProps);
    }

    // Setup header event listeners
    this.setupHeaderEvents();
    
    // Load conversation
    this.loadConversation();
  }

  private setupHeaderEvents() {
    const clearChatBtn = this.container.querySelector('#clear-chat-btn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', this.clearConversation.bind(this));
    }

    const chatInfoBtn = this.container.querySelector('#chat-info-btn');
    if (chatInfoBtn) {
      chatInfoBtn.addEventListener('click', this.showChatInfo.bind(this));
    }
  }

  private async loadConversation() {
    if (!this.props.selectedFriend || !this.currentUser || !this.currentUser.id || !this.props.selectedFriend.id) return;

    this.setLoading(true);
    
    try {
      const messages = await api.getConversationMessages(
        this.currentUser.id,
        this.props.selectedFriend.id
      );
      
      this.messages = Array.isArray(messages) ? messages : [];
      // Use updateMessageListWithoutScroll to prevent auto-scroll when switching conversations
      this.updateMessageListWithoutScroll();
    } catch (error) {
      console.error('Failed to load conversation:', error);
      this.showError('Failed to load conversation. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  private async loadMoreMessages() {
    // Implement pagination if needed
    console.log('Load more messages requested');
  }

  private async sendMessage(content: string): Promise<void> {
    // Validate message content
    const messageValidation = validateMessage(content);
    if (!messageValidation.isValid) {
      errorHandler.showValidationErrors(messageValidation);
      return;
    }

    const userValidation = validateUser(this.currentUser);
    if (!userValidation.isValid) {
      errorHandler.showValidationErrors(userValidation);
      return;
    }

    const friendValidation = validateUser(this.props.selectedFriend);
    if (!friendValidation.isValid) {
      errorHandler.showError('Please select a valid friend to send message to');
      return;
    }

    const message: Message = {
      senderId: this.currentUser!.id!,
      receiverId: this.props.selectedFriend!.id!,
      content: content.trim(),
      sentAt: new Date().toISOString()
    };

    // Show warnings if any
    if (messageValidation.warnings && messageValidation.warnings.length > 0) {
      errorHandler.showValidationErrors({ isValid: true, errors: [], warnings: messageValidation.warnings });
    }

    // Add message to UI optimistically
    this.addMessageToUI(message);

    try {
      // Try Socket.IO first for real-time delivery
      if (this.props.socket && this.props.socket.connected) {
        this.props.socket.emit('send-private-message', {
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          senderName: this.currentUser!.fullName || 'Unknown User'
        });
        
        // Show success feedback
        // errorHandler.showSuccess('Message sent successfully', 2000);
      } else {
        // Fallback to API if socket is not available
        await this.sendMessageViaAPI(message);
        // errorHandler.showSuccess('Message sent via API', 2000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add to retry queue
      this.retryQueue.push(message);
      handleNetworkError(error);
      throw new Error('Failed to send message. It will be retried automatically.');
    }
  }

  private async sendMessageViaAPI(message: Message): Promise<void> {
    try {
      const response = await api.sendMessage(message);
      if (!response.success) {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('API message send failed:', error);
      throw error;
    }
  }

  private addMessageToUI(message: Message) {
    this.messages.push(message);
    
    // Use smooth message addition instead of full re-render
    if (this.messageList) {
      this.messageList.addMessage(message);
    }
  }

  private updateMessageList() {
    if (this.messageList) {
      this.messageList.updateProps({
        messages: this.messages,
        isLoading: this.isLoading
      });
    }
  }

  private updateMessageListWithoutScroll() {
    if (this.messageList) {
      this.messageList.updatePropsWithoutScroll({
        messages: this.messages,
        isLoading: this.isLoading
      });
    }
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    
    // Update loading state without full re-render
    if (this.messageList) {
      this.messageList.updateLoadingState(loading);
    }
    
    if (this.messageInput) {
      this.messageInput.updateProps({ disabled: loading });
    }
  }

  private setupSocketListeners() {
    if (!this.props.socket) return;

    // Listen for new messages
    this.props.socket.on('new-private-message', (messageData: any) => {
      try {
        // Validate incoming message
        const messageValidation = validateMessage(messageData.content || '');
        if (!messageValidation.isValid) {
          console.warn('Received invalid message:', messageValidation.errors);
          return;
        }
        
        this.handleNewMessage(messageData);
        
        // Show notification for new message
        errorHandler.showInfo(`New message from ${messageData.senderName || 'Unknown'}`, 3000);
      } catch (error) {
        console.error('Error processing incoming message:', error);
        errorHandler.showError('Failed to process incoming message');
      }
    });

    // Listen for message sent confirmation
    this.props.socket.on('message-sent-success', (messageData: any) => {
      this.handleMessageSentSuccess(messageData);
      // errorHandler.showSuccess('Message delivered', 2000);
    });

    // Listen for message send errors
    this.props.socket.on('message-sent-error', (error: any) => {
      this.handleMessageSentError(error);
      errorHandler.showError(error.message || 'Failed to send message');
    });

    // Handle connection status
    this.props.socket.on('connect', () => {
      this.wasEverConnected = true;
      this.retryFailedMessages();
    });

    // Listen for connection errors
    this.props.socket.on('connect_error', (error: any) => {
      handleSocketError(error);
    });

    // Listen for disconnection
    this.props.socket.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect') {
        errorHandler.showError('Disconnected from server. Please refresh the page.');
      } else if (this.wasEverConnected) {
        errorHandler.showInfo('Connection lost. Attempting to reconnect...', 4000);
      }
    });

    // Listen for reconnection
    this.props.socket.on('reconnect', () => {
      errorHandler.showSuccess('Reconnected to server', 3000);
    });
  }

  private handleNewMessage(messageData: any) {
    if (!this.props.selectedFriend || !this.currentUser) return;

    // Only add message if it's part of current conversation
    if (messageData.senderId === this.props.selectedFriend.id || 
        messageData.receiverId === this.props.selectedFriend.id) {
      
      const message: Message = {
        id: messageData.id,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        sentAt: messageData.sentAt
      };
      
      this.addMessageToUI(message);
    }
  }

  private handleMessageSentSuccess(messageData: any) {
    // Message was successfully sent via socket
    console.log('Message sent successfully:', messageData);
  }

  private handleMessageSentError(error: any) {
    console.error('Socket message send failed:', error);
    this.showError('Failed to send message. Please check your connection.');
  }

  private async retryFailedMessages() {
    if (this.retryQueue.length === 0) return;

    const messagesToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const message of messagesToRetry) {
      try {
        await this.sendMessageViaAPI(message);
      } catch (error) {
        // If retry fails, add back to queue
        this.retryQueue.push(message);
      }
    }
  }

  private async clearConversation() {
    if (!this.props.selectedFriend || !this.currentUser || !this.currentUser.id || !this.props.selectedFriend.id) return;

    if (!confirm(i18n.t('chat.confirmClearConversation'))) {
      return;
    }

    try {
      const response = await api.clearConversationForUser(
        this.currentUser.id,
        this.props.selectedFriend.id
      );
      
      if (response.success) {
        this.messages = [];
        this.updateMessageList();
        this.showSuccess(i18n.t('chat.conversationClearedSuccessfully'));
      } else {
        throw new Error(response.message || 'Failed to clear conversation');
      }
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      this.showError(i18n.t('chat.failedToClearConversation'));
    }
  }

  private showChatInfo() {
    if (!this.props.selectedFriend) return;
    
    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.chat-info-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }
    
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'chat-info-dropdown fixed bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-xl z-50 min-w-[200px] py-2';
    
    // Position dropdown relative to the chat info button
    const chatInfoBtn = document.querySelector('#chat-info-btn') as HTMLElement;
    if (chatInfoBtn) {
      const rect = chatInfoBtn.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.right = `${window.innerWidth - rect.right}px`;
    }
    
    dropdown.innerHTML = `
      <button 
        id="dropdown-user-info" 
        class="w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 transition-colors flex items-center space-x-3 group"
      >
        <svg class="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span>${i18n.t('profile.viewProfille')}</span>
      </button>
      
      <button 
        id="dropdown-play-game" 
        class="w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 transition-colors flex items-center space-x-3 group"
      >
        <svg class="w-5 h-5 text-green-400 group-hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>${i18n.t('game.playGame')}</span>
      </button>
      
      <div class="border-t border-gray-600 my-1"></div>
      
      <button 
        id="dropdown-block-user" 
        class="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-3 group"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
        </svg>
        <span>${i18n.t('chat.blockUser')}</span>
      </button>
    `;
    
    // Add dropdown to document
    document.body.appendChild(dropdown);
    
    // Add animation
    requestAnimationFrame(() => {
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(-10px) scale(0.95)';
      dropdown.style.transition = 'all 0.2s ease-out';
      
      requestAnimationFrame(() => {
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0) scale(1)';
      });
    });
    
    // Setup event handlers
    this.setupDropdownHandlers(dropdown);
    
    // Close dropdown when clicking outside
    const closeDropdown = (e: Event) => {
      if (!dropdown.contains(e.target as Node) && e.target !== chatInfoBtn) {
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => dropdown.remove(), 200);
        document.removeEventListener('click', closeDropdown);
      }
    };
    
    setTimeout(() => {
       document.addEventListener('click', closeDropdown);
     }, 100);
   }

  private setupDropdownHandlers(dropdown: HTMLElement) {
    const userInfoBtn = dropdown.querySelector('#dropdown-user-info');
    const playGameBtn = dropdown.querySelector('#dropdown-play-game');
    const blockUserBtn = dropdown.querySelector('#dropdown-block-user');

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

    if (blockUserBtn) {
      blockUserBtn.addEventListener('click', async () => {
        await blockCurrentUser();
        dropdown.remove();
      });
    }
  }

  private showError(message: string) {
    // Create a temporary error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 300);
    }, 3000);
  }

  private showSuccess(message: string) {
    // Create a temporary success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv);
        }
      }, 300);
    }, 3000);
  }

  public destroy() {
    if (this.messageList) {
      this.messageList.destroy();
    }
    
    if (this.messageInput) {
      this.messageInput.destroy();
    }

    // Remove socket listeners
    if (this.props.socket) {
      this.props.socket.off('new-private-message');
      this.props.socket.off('message-sent-success');
      this.props.socket.off('message-sent-error');
      this.props.socket.off('connect');
      this.props.socket.off('connect_error');
      this.props.socket.off('disconnect');
      this.props.socket.off('reconnect');
    }
  }
}