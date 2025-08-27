import { ChatPageManager } from './ChatPageManager';
import { getCurrentUser } from '../../utils/authState';
import { User } from '../../types/user';

/**
 * Demo class to showcase the new chat components
 * This can be integrated into the existing ChatPage.ts
 */
export class ChatDemo {
  private chatManager: ChatPageManager | null = null;
  private container: HTMLElement;
  private socket: any;

  constructor(container: HTMLElement, socket: any) {
    this.container = container;
    this.socket = socket;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <!-- Demo Header -->
        <div class="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
          <h1 class="text-2xl font-bold text-white mb-2">New Chat Components Demo</h1>
          <p class="text-white/60">Modern, responsive chat interface with improved UX</p>
        </div>

        <!-- Chat Container -->
        <div class="h-full" id="chat-container"></div>

        <!-- Demo Controls -->
        <div class="fixed bottom-4 right-4 space-y-2">
          <button 
            id="demo-friend-btn"
            class="block w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Select Demo Friend
          </button>
          <button 
            id="clear-demo-btn"
            class="block w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Clear Demo
          </button>
        </div>
      </div>
    `;

    this.setupDemoControls();
  }

  private setupDemoControls() {
    const demoFriendBtn = this.container.querySelector('#demo-friend-btn');
    const clearDemoBtn = this.container.querySelector('#clear-demo-btn');
    const chatContainer = this.container.querySelector('#chat-container') as HTMLElement;

    if (demoFriendBtn) {
      demoFriendBtn.addEventListener('click', () => {
        this.initializeDemoChat(chatContainer);
      });
    }

    if (clearDemoBtn) {
      clearDemoBtn.addEventListener('click', () => {
        this.clearDemo(chatContainer);
      });
    }
  }

  private initializeDemoChat(chatContainer: HTMLElement) {
    // Create a demo friend
    const demoFriend: User = {
      id: 'demo-friend-123',
      fullName: 'Demo Friend',
      nickName: 'demo_user',
      email: 'demo@example.com',
      picture: '',
      verified: true
    };

    // Clean up existing chat manager
    if (this.chatManager) {
      this.chatManager.destroy();
    }

    // Initialize new chat manager
    this.chatManager = new ChatPageManager(chatContainer, {
      selectedFriend: demoFriend,
      socket: this.socket,
      onFriendSelect: (friend) => {
        console.log('Friend selected:', friend);
      }
    });

    // Show success message
    this.showNotification('Demo chat initialized! Try sending a message.', 'success');
  }

  private clearDemo(chatContainer: HTMLElement) {
    if (this.chatManager) {
      this.chatManager.destroy();
      this.chatManager = null;
    }

    chatContainer.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Chat Demo</h3>
          <p class="text-white/60">Click 'Select Demo Friend' to test the new chat components</p>
        </div>
      </div>
    `;

    this.showNotification('Demo cleared', 'info');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const colors = {
      success: 'bg-green-500/90',
      error: 'bg-red-500/90',
      info: 'bg-blue-500/90'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = 'translate(-50%, -100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  public destroy() {
    if (this.chatManager) {
      this.chatManager.destroy();
    }
  }
}

// Usage example:
// const demoContainer = document.getElementById('demo-container');
// const socket = io(); // Your socket instance
// const chatDemo = new ChatDemo(demoContainer, socket);