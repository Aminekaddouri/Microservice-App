export interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

import { errorHandler, validateMessage } from './ErrorHandler';
import { i18n } from '@/services/i18n';

export class MessageInput {
  private container: HTMLElement;
  private props: MessageInputProps;
  private textArea: HTMLTextAreaElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private isLoading: boolean = false;

  constructor(container: HTMLElement, props: MessageInputProps) {
    this.container = container;
    this.props = props;
    this.render();
    this.setupEventListeners();
  }

  private render() {
    this.container.innerHTML = `
      <div class="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div class="p-4">
          <form id="message-form" class="flex items-end space-x-3">
            <!-- Message Input -->
            <div class="flex-1 relative">
              <textarea
                id="message-textarea"
                placeholder="${this.props.placeholder || i18n.t('chat.typeMessage')}"
                maxlength="${this.props.maxLength || 1000}"
                rows="1"
                class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                style="min-height: 44px; max-height: 120px;"
                ${this.props.disabled ? 'disabled' : ''}
              ></textarea>
              
              <!-- Character Counter -->
              <div class="absolute bottom-1 right-3 text-xs text-white/40" id="char-counter">
                0/${this.props.maxLength || 1000}
              </div>
            </div>
            
            <!-- Send Button -->
            <button
              type="submit"
              id="send-button"
              class="flex-shrink-0 w-11 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              ${this.props.disabled ? 'disabled' : ''}
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </form>
          
          <!-- Typing Indicator (hidden by default) -->
          <div id="typing-indicator" class="hidden mt-2 text-sm text-white/60">
            <div class="flex items-center space-x-2">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-white/40 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-white/40 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
              <span>Someone is typing...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.textArea = this.container.querySelector('#message-textarea');
    this.sendButton = this.container.querySelector('#send-button');
  }

  private setupEventListeners() {
    if (!this.textArea || !this.sendButton) return;

    // Form submission
    const form = this.container.querySelector('#message-form') as HTMLFormElement;
    form?.addEventListener('submit', this.handleSubmit.bind(this));

    // Auto-resize textarea
    this.textArea.addEventListener('input', this.handleTextAreaInput.bind(this));

    // Keyboard shortcuts
    this.textArea.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Character counter
    this.textArea.addEventListener('input', this.updateCharacterCounter.bind(this));
  }

  private handleSubmit(event: Event) {
    event.preventDefault();
    if (!this.textArea || this.isLoading) return;

    const content = this.textArea.value.trim();
    
    // Validate message before sending
    const validation = validateMessage(content);
    if (!validation.isValid) {
      errorHandler.showValidationErrors(validation);
      return;
    }
    
    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      errorHandler.showValidationErrors({ isValid: true, errors: [], warnings: validation.warnings });
    }

    this.sendMessage(content);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.isLoading) {
        this.handleSubmit(event);
      }
    }
  }

  private handleTextAreaInput() {
    if (!this.textArea) return;

    // Auto-resize
    this.textArea.style.height = 'auto';
    this.textArea.style.height = Math.min(this.textArea.scrollHeight, 120) + 'px';

    // Update send button state
    this.updateSendButtonState();
  }

  private updateCharacterCounter() {
    if (!this.textArea) return;

    const counter = this.container.querySelector('#char-counter');
    if (counter) {
      const currentLength = this.textArea.value.length;
      const maxLength = this.props.maxLength || 1000;
      counter.textContent = `${currentLength}/${maxLength}`;
      
      // Change color based on usage
      if (currentLength > maxLength) {
         counter.className = 'absolute bottom-1 right-3 text-xs text-red-600 font-semibold';
         errorHandler.showError(`Message exceeds maximum length of ${maxLength} characters`, { type: 'warning', duration: 3000 });
      } else if (currentLength > maxLength * 0.9) {
        counter.className = 'absolute bottom-1 right-3 text-xs text-red-400';
      } else if (currentLength > maxLength * 0.7) {
        counter.className = 'absolute bottom-1 right-3 text-xs text-yellow-400';
      } else {
        counter.className = 'absolute bottom-1 right-3 text-xs text-white/40';
      }
    }
  }

  private updateSendButtonState() {
    if (!this.textArea || !this.sendButton) return;

    const hasContent = this.textArea.value.trim().length > 0;
    const isDisabled = this.props.disabled || this.isLoading || !hasContent;
    
    this.sendButton.disabled = isDisabled;
    
    if (isDisabled) {
      this.sendButton.className = this.sendButton.className.replace(
        'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        'from-gray-500 to-gray-600'
      );
    } else {
      this.sendButton.className = this.sendButton.className.replace(
        'from-gray-500 to-gray-600',
        'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
      );
    }
  }

  private async sendMessage(content: string) {
    if (!this.textArea || this.isLoading) return;

    this.setLoading(true);
    
    try {
      await this.props.onSendMessage(content);
      this.clearInput();
      // errorHandler.showSuccess('Message sent!', 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
      errorHandler.showError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    
    if (this.sendButton) {
      if (loading) {
        this.sendButton.innerHTML = `
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        `;
      } else {
        this.sendButton.innerHTML = `
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        `;
      }
    }
    
    this.updateSendButtonState();
  }

  private clearInput() {
    if (this.textArea) {
      this.textArea.value = '';
      this.textArea.style.height = 'auto';
      this.updateCharacterCounter();
      this.updateSendButtonState();
      this.textArea.focus();
    }
  }

  private showError(message: string) {
    // Use the centralized error handler instead of local error display
    errorHandler.showError(message);
  }

  private updateUI() {
    if (this.textArea) {
      this.textArea.disabled = this.props.disabled || false;
      this.textArea.placeholder = this.props.placeholder || i18n.t('chat.typeMessage');
      this.textArea.maxLength = this.props.maxLength || 1000;
    }
    
    this.updateSendButtonState();
    this.updateCharacterCounter();
  }

  public focus() {
    if (this.textArea) {
      this.textArea.focus();
    }
  }
  
  public validateInput(): boolean {
    if (!this.textArea) return false;
    
    const content = this.textArea.value.trim();
    const validation = validateMessage(content);
    
    if (!validation.isValid) {
      errorHandler.showValidationErrors(validation);
      return false;
    }
    
    return true;
  }
  
  public getInputValue(): string {
    return this.textArea?.value.trim() || '';
  }

  public showTypingIndicator(show: boolean = true) {
    const indicator = this.container.querySelector('#typing-indicator');
    if (indicator) {
      if (show) {
        indicator.classList.remove('hidden');
      } else {
        indicator.classList.add('hidden');
      }
    }
  }

  public updateProps(newProps: Partial<MessageInputProps>) {
    this.props = { ...this.props, ...newProps };
    this.updateUI();
  }

  public destroy() {
    // Clean up event listeners
    this.container.innerHTML = '';
  }
}