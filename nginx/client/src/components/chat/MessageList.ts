import { Message } from '../../types/message';
import { User } from '../../types/user';
import { errorHandler, validateMessage } from './ErrorHandler';

export interface MessageListProps {
  messages: Message[];
  currentUser: User;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export class MessageList {
  private container: HTMLElement;
  private props: MessageListProps;
  private scrollContainer: HTMLElement | null = null;

  constructor(container: HTMLElement, props: MessageListProps) {
    this.container = container;
    this.props = props;
    this.render();
    this.setupScrollListener();
  }

  public updateProps(newProps: Partial<MessageListProps>) {
    try {
      this.props = { ...this.props, ...newProps };
      this.render();
    } catch (error) {
      console.error('Failed to update message list props:', error);
      errorHandler.showError('Failed to update message display');
    }
  }

  public updatePropsWithoutScroll(newProps: Partial<MessageListProps>) {
    try {
      this.props = { ...this.props, ...newProps };
      this.renderWithoutScroll();
    } catch (error) {
      console.error('Failed to update message list props:', error);
      errorHandler.showError('Failed to update message display');
    }
  }

  public updateLoadingState(isLoading: boolean) {
    this.props.isLoading = isLoading;
    
    // Find the main flex container
    const mainContainer = this.container.querySelector('.flex.flex-col.h-full.relative');
    if (!mainContainer) return;
    
    // Remove existing loading indicator
    const existingIndicator = mainContainer.querySelector('.loading-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (isLoading) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'loading-indicator';
      loadingElement.innerHTML = this.renderLoadingIndicator();
      mainContainer.appendChild(loadingElement);
    }
  }
  
  public clearMessages(): void {
    this.props.messages = [];
    this.render();
    errorHandler.showInfo('Messages cleared', 2000);
  }
  
  public getMessageCount(): number {
    return this.props.messages.length;
  }
  
  public validateAllMessages(): boolean {
    const invalidMessages = this.props.messages.filter(msg => {
      const validation = validateMessage(msg.content || '');
      return !validation.isValid;
    });
    
    if (invalidMessages.length > 0) {
      errorHandler.showError(`Found ${invalidMessages.length} invalid messages`);
      return false;
    }
    
    return true;
  }

  private render() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full relative">
        <!-- Messages Container -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-4 scroll-smooth" id="messages-scroll-container" style="scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) transparent;">
          ${this.renderMessages()}
        </div>
        
        <!-- Loading Indicator -->
        ${this.props.isLoading ? `<div class="loading-indicator">${this.renderLoadingIndicator()}</div>` : ''}
      </div>
    `;

    this.scrollContainer = this.container.querySelector('#messages-scroll-container');
    // Only scroll to bottom on initial render, not when switching conversations
    if (this.props.messages.length > 0) {
      this.scrollToBottom(false); // Use instant scroll for conversation switches
    }
  }

  private renderWithoutScroll() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full relative">
        <!-- Messages Container -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-4 scroll-smooth" id="messages-scroll-container" style="scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) transparent;">
          ${this.renderMessages()}
        </div>
        
        <!-- Loading Indicator -->
        ${this.props.isLoading ? `<div class="loading-indicator">${this.renderLoadingIndicator()}</div>` : ''}
      </div>
    `;

    this.scrollContainer = this.container.querySelector('#messages-scroll-container');
    // Scroll to bottom instantly to show latest messages when switching conversations
    if (this.props.messages.length > 0) {
      this.scrollToBottom(false); // Use instant scroll
    }
  }

  private renderMessages(): string {
    if (!this.props.messages || this.props.messages.length === 0) {
      return this.renderEmptyState();
    }

    return this.props.messages.map(message => this.renderMessage(message)).join('');
  }

  private renderMessage(message: Message): string {
    const isOwnMessage = message.senderId === this.props.currentUser.id;
    const messageTime = message.sentAt ? new Date(message.sentAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

    return `
      <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4">
        <div class="flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2">
          <!-- Avatar -->
          ${!isOwnMessage ? `
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              ${message.senderId ? message.senderId.charAt(0).toUpperCase() : 'U'}
            </div>
          ` : ''}
          
          <!-- Message Bubble -->
          <div class="${
            isOwnMessage 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
          } rounded-2xl px-4 py-2 shadow-lg">
            <p class="text-sm leading-relaxed break-words">${this.escapeHtml(message.content)}</p>
            <div class="flex items-center justify-end mt-1">
              <span class="text-xs opacity-70">${messageTime}</span>
              ${isOwnMessage && message.readAt ? `
                <span class="ml-2 text-xs opacity-70">✓✓</span>
              ` : isOwnMessage ? `
                <span class="ml-2 text-xs opacity-70">✓</span>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderEmptyState(): string {
    return `
      <div class="flex flex-col items-center justify-center h-full text-center py-12">
        <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">No messages yet</h3>
        <p class="text-white/60 text-sm max-w-sm">
          Start a conversation by sending a message below.
        </p>
        <div class="mt-4 text-sm text-white/40">
          <p>💡 Tip: Messages are validated for safety and quality</p>
        </div>
      </div>
    `;
  }

  private renderLoadingIndicator(): string {
    return `
      <div class="flex justify-center py-4">
        <div class="flex items-center space-x-2 text-white/60">
          <div class="w-2 h-2 bg-current rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <span class="text-sm ml-2">Loading messages...</span>
        </div>
      </div>
    `;
  }

  private setupScrollListener() {
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', async () => {
        if (this.scrollContainer!.scrollTop === 0 && this.props.onLoadMore) {
          try {
            await this.props.onLoadMore();
            errorHandler.showSuccess('Messages loaded', 1500);
          } catch (error) {
            console.error('Failed to load more messages:', error);
            errorHandler.showError('Failed to load more messages. Please try again.');
          }
        }
      });
    }
  }

  public scrollToBottom(smooth: boolean = true) {
    if (this.scrollContainer) {
      const scrollOptions: ScrollToOptions = {
        top: this.scrollContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      };
      this.scrollContainer.scrollTo(scrollOptions);
    }
  }

  private isUserNearBottom(): boolean {
    if (!this.scrollContainer) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
    const threshold = 100; // pixels from bottom
    
    return scrollHeight - scrollTop - clientHeight < threshold;
  }

  private appendMessageToDOM(message: Message) {
    if (!this.scrollContainer) return;
    
    // If this is the first message, clear empty state
    if (this.props.messages.length === 1) {
      this.render();
      return;
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.innerHTML = this.renderMessage(message);
    
    // Add smooth entrance animation
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(20px)';
    messageElement.style.transition = 'all 0.3s ease-out';
    
    // Append to container
    this.scrollContainer.appendChild(messageElement.firstElementChild as HTMLElement);
    
    // Trigger animation
    requestAnimationFrame(() => {
      messageElement.style.opacity = '1';
      messageElement.style.transform = 'translateY(0)';
    });
  }

  public addMessage(message: Message) {
    // Validate message before adding
    const validation = validateMessage(message.content || '');
    if (!validation.isValid) {
      console.warn('Attempting to add invalid message:', validation.errors);
      errorHandler.showError('Invalid message received');
      return;
    }
    
    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Message warnings:', validation.warnings);
    }
    
    this.props.messages.push(message);
    
    // Check if user is near bottom before adding message
    const wasNearBottom = this.isUserNearBottom();
    
    // Add message smoothly without full re-render
    this.appendMessageToDOM(message);
    
    // Only auto-scroll if user was already near bottom
    if (wasNearBottom) {
      this.scrollToBottom(true);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public destroy() {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', () => {});
    }
    this.container.innerHTML = '';
  }
}