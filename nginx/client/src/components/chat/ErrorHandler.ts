/**
 * Comprehensive error handling and validation utilities for chat components
 */

import { i18n } from '@/services/i18n';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ErrorDisplayOptions {
  duration?: number;
  type?: 'error' | 'warning' | 'info' | 'success';
  position?: 'top' | 'bottom' | 'center';
  dismissible?: boolean;
}

export class ChatErrorHandler {
  private static instance: ChatErrorHandler;
  private errorContainer: HTMLElement | null = null;
  private activeNotifications: Map<string, HTMLElement> = new Map();

  private constructor() {
    this.createErrorContainer();
  }

  public static getInstance(): ChatErrorHandler {
    if (!ChatErrorHandler.instance) {
      ChatErrorHandler.instance = new ChatErrorHandler();
    }
    return ChatErrorHandler.instance;
  }

  private createErrorContainer(): void {
    if (this.errorContainer) return;

    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'chat-error-container';
    this.errorContainer.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-md';
    document.body.appendChild(this.errorContainer);
  }

  /**
   * Validate message content before sending
   */
  public validateMessage(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if message is empty or only whitespace
    if (!content || content.trim().length === 0) {
      errors.push(i18n.t('chat.messageCannotBeEmpty'));
    }

    // Check message length
    const maxLength = 1000;
    if (content.length > maxLength) {
      errors.push(i18n.t('chat.messageTooLong') + ` (${content.length}/${maxLength} ${i18n.t('common.characters')})`);
    }

    // Check for potentially harmful content
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push(i18n.t('chat.messageContainsHarmfulContent'));
        break;
      }
    }

    // Check for excessive special characters
    const specialCharCount = (content.match(/[^\w\s]/g) || []).length;
    if (specialCharCount > content.length * 0.5) {
      warnings.push(i18n.t('chat.messageContainsManySpecialCharacters'));
    }

    // Check for excessive uppercase
    const uppercaseCount = (content.match(/[A-Z]/g) || []).length;
    if (uppercaseCount > content.length * 0.7 && content.length > 10) {
      warnings.push(i18n.t('chat.messageAppearsToBeShouting'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate user selection for chat
   */
  public validateUserSelection(user: any): ValidationResult {
    const errors: string[] = [];

    if (!user) {
      errors.push(i18n.t('chat.noUserSelected'));
    } else {
      if (!user.id) {
        errors.push(i18n.t('chat.invalidUserMissingId'));
      }
      if (!user.fullName && !user.nickName) {
        errors.push(i18n.t('chat.invalidUserMissingName'));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate API response
   */
  public validateApiResponse(response: any, expectedFields: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!response) {
      errors.push(i18n.t('errors.noResponseFromServer'));
      return { isValid: false, errors };
    }

    if (response.error) {
      errors.push(response.error.message || i18n.t('errors.serverError'));
    }

    for (const field of expectedFields) {
      if (!(field in response)) {
        errors.push(i18n.t('errors.missingRequiredField') + `: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Display error notification to user
   */
  public showError(
    message: string,
    options: ErrorDisplayOptions = {}
  ): string {
    const {
      duration = 5000,
      type = 'error',
      position = 'top',
      dismissible = true
    } = options;

    const notificationId = this.generateId();
    const notification = this.createNotification(message, type, dismissible, notificationId);

    if (this.errorContainer) {
      this.errorContainer.appendChild(notification);
      this.activeNotifications.set(notificationId, notification);

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          this.dismissNotification(notificationId);
        }, duration);
      }
    }

    return notificationId;
  }

  /**
   * Show multiple errors at once
   */
  public showErrors(errors: string[], options: ErrorDisplayOptions = {}): string[] {
    return errors.map(error => this.showError(error, options));
  }

  /**
   * Show validation errors
   */
  public showValidationErrors(validation: ValidationResult, options: ErrorDisplayOptions = {}): string[] {
    const notificationIds: string[] = [];

    // Show errors
    notificationIds.push(...this.showErrors(validation.errors, {
      ...options,
      type: 'error'
    }));

    // Show warnings
    if (validation.warnings && validation.warnings.length > 0) {
      notificationIds.push(...this.showErrors(validation.warnings, {
        ...options,
        type: 'warning',
        duration: 3000
      }));
    }

    return notificationIds;
  }

  /**
   * Show success message
   */
  public showSuccess(message: string, duration: number = 3000): string {
    return this.showError(message, {
      type: 'success',
      duration
    });
  }

  /**
   * Show info message
   */
  public showInfo(message: string, duration: number = 4000): string {
    return this.showError(message, {
      type: 'info',
      duration
    });
  }

  /**
   * Dismiss a specific notification
   */
  public dismissNotification(notificationId: string): void {
    const notification = this.activeNotifications.get(notificationId);
    if (notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.activeNotifications.delete(notificationId);
      }, 300);
    }
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.activeNotifications.forEach((_, id) => {
      this.dismissNotification(id);
    });
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(error: any): string {
    let message = i18n.t('errors.networkError');
    
    if (error.code === 'NETWORK_ERROR') {
      message = i18n.t('errors.unableToConnectToServer');
    } else if (error.code === 'TIMEOUT') {
      message = i18n.t('errors.requestTimedOut');
    } else if (error.status === 401) {
      message = i18n.t('errors.authenticationError');
    } else if (error.status === 403) {
      message = i18n.t('errors.accessDenied');
    } else if (error.status === 404) {
      message = i18n.t('errors.resourceNotFound');
    } else if (error.status === 500) {
      message = i18n.t('errors.serverError');
    } else if (error.message) {
      message = error.message;
    }

    return this.showError(message, { type: 'error', duration: 6000 });
  }

  /**
   * Handle Socket.IO connection errors
   */
  public handleSocketError(error: any): string {
    let message = i18n.t('errors.realTimeConnectionError');
    
    if (error.type === 'TransportError') {
      message = i18n.t('errors.connectionFailedSwitchingToPolling');
    } else if (error.type === 'TimeoutError') {
      message = i18n.t('errors.connectionTimedOutReconnecting');
    } else if (error.description) {
      message = i18n.t('errors.connectionError') + `: ${error.description}`;
    }

    return this.showError(message, { type: 'warning', duration: 4000 });
  }

  private createNotification(
    message: string,
    type: string,
    dismissible: boolean,
    id: string
  ): HTMLElement {
    const notification = document.createElement('div');
    notification.className = this.getNotificationClasses(type);
    notification.setAttribute('data-notification-id', id);

    const icon = this.getNotificationIcon(type);
    const dismissButton = dismissible ? this.createDismissButton(id) : '';

    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-white">
            ${this.escapeHtml(message)}
          </p>
        </div>
        ${dismissButton}
      </div>
    `;

    // Add dismiss functionality
    if (dismissible) {
      const dismissBtn = notification.querySelector('[data-dismiss]');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          this.dismissNotification(id);
        });
      }
    }

    // Add entrance animation
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);

    return notification;
  }

  private getNotificationClasses(type: string): string {
    const baseClasses = 'relative p-4 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ease-in-out';
    
    const typeClasses = {
      error: 'bg-red-500/90 border-red-400/50 text-white',
      warning: 'bg-yellow-500/90 border-yellow-400/50 text-white',
      success: 'bg-green-500/90 border-green-400/50 text-white',
      info: 'bg-blue-500/90 border-blue-400/50 text-white'
    };

    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.info}`;
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      error: `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
      </svg>`,
      warning: `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>`,
      success: `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>`,
      info: `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>`
    };

    return icons[type as keyof typeof icons] || icons.info;
  }

  private createDismissButton(id: string): string {
    return `
      <div class="ml-4 flex-shrink-0 flex">
        <button 
          data-dismiss="${id}"
          class="inline-flex text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 transition-colors duration-200"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup method for destroying the error handler
   */
  public destroy(): void {
    this.clearAll();
    if (this.errorContainer && this.errorContainer.parentNode) {
      this.errorContainer.parentNode.removeChild(this.errorContainer);
    }
    this.errorContainer = null;
    this.activeNotifications.clear();
  }
}

// Export singleton instance
export const errorHandler = ChatErrorHandler.getInstance();

// Export utility functions
export const validateMessage = (content: string) => errorHandler.validateMessage(content);
export const validateUser = (user: any) => errorHandler.validateUserSelection(user);
export const showError = (message: string, options?: ErrorDisplayOptions) => errorHandler.showError(message, options);
export const showSuccess = (message: string, duration?: number) => errorHandler.showSuccess(message, duration);
export const showInfo = (message: string, duration?: number) => errorHandler.showInfo(message, duration);
export const handleNetworkError = (error: any) => errorHandler.handleNetworkError(error);
export const handleSocketError = (error: any) => errorHandler.handleSocketError(error);