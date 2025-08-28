import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import { i18n } from '../services/i18n';

export class NotificationDropdown {
    private dropdownId: string;
    private parentElement: HTMLElement;
    private onNotificationClick?: (friendId: string) => void;

    constructor(dropdownId: string, parentElement: HTMLElement, onNotificationClick?: (friendId: string) => void) {
        this.dropdownId = dropdownId;
        this.parentElement = parentElement;
        this.onNotificationClick = onNotificationClick;
    }

    /**
     * Shows notification dropdown
     */
    async show() {

        // Remove existing dropdown
        const existing = document.getElementById(this.dropdownId);
        if (existing) {
            existing.remove();
        }

        const dropdown = this.createDropdownElement();
        this.parentElement.style.position = 'relative';
        this.parentElement.appendChild(dropdown);

        await this.loadNotifications(dropdown);
        this.setupEventListeners(dropdown);
    }

    /**
     * Creates the dropdown HTML element
     */
    private createDropdownElement(): HTMLElement {
        const dropdown = document.createElement('div');
        dropdown.id = this.dropdownId;
        dropdown.className = 'absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50';

        dropdown.innerHTML = `
            <div class="p-4">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold text-gray-800">🔔 ${i18n.t('notifications.title')}</h3>
                    <button id="clear-all-${this.dropdownId}" class="text-sm text-blue-600 hover:text-blue-800">${i18n.t('notifications.clearAll')}</button>
                </div>
                <div id="${this.dropdownId}-list" class="max-h-60 overflow-y-auto">
                    <div class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p class="text-sm text-gray-500 mt-2">Loading notifications...</p>
                    </div>
                </div>
            </div>
        `;

        return dropdown;
    }

    /**
     * Loads notifications from API
     */
    private async loadNotifications(dropdown: HTMLElement) {
        try {
            const response = await api.getNotifications();
            console.log("Fetched notifications:", response);
            const notificationList = dropdown.querySelector(`#${this.dropdownId}-list`) as HTMLElement;

            if (notificationList) {
                if (response.success && response.notifs && Array.isArray(response.notifs) && response.notifs.length > 0) {
                    const notificationHTML = await notificationService.generateNotificationListFromAPI(response.notifs);

                    if (notificationHTML && notificationHTML.length > 0) {
                        notificationList.innerHTML = notificationHTML;
                        this.setupNotificationClickHandlers(notificationList);
                    } else {
                        notificationList.innerHTML = this.getEmptyStateHTML('Unable to display notifications');
                    }
                } else {
                    notificationList.innerHTML = this.getEmptyStateHTML();
                }
            }
        } catch (error) {
            console.error(`Error loading ${this.dropdownId}:`, error);
            const notificationList = dropdown.querySelector(`#${this.dropdownId}-list`) as HTMLElement;
            if (notificationList) {
                notificationList.innerHTML = this.getErrorStateHTML();
            }
        }
    }

    /**
     * Sets up click handlers for notification items
     */
    private setupNotificationClickHandlers(notificationList: HTMLElement) {
        notificationList.querySelectorAll('[data-notification-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                const notificationId = (e.currentTarget as HTMLElement).getAttribute('data-notification-id');
                const senderId = (e.currentTarget as HTMLElement).getAttribute('data-sender-id');

                if (senderId && this.onNotificationClick) {
                    this.onNotificationClick(senderId);
                    this.remove();
                }
            });
        });
    }

    /**
     * Sets up event listeners for dropdown
     */
    private setupEventListeners(dropdown: HTMLElement) {
        // Clear all button
        const clearAllBtn = dropdown.querySelector(`#clear-all-${this.dropdownId}`) as HTMLElement;
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                notificationService.clearAllNotifications();
                this.remove();
            });
        }

        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this));
        }, 100);
    }

    /**
     * Handles clicks outside the dropdown
     */
    private handleOutsideClick(e: Event) {
        const dropdown = document.getElementById(this.dropdownId);
        if (dropdown && !dropdown.contains(e.target as Node)) {
            this.remove();
        }
    }

    /**
     * Removes the dropdown
     */
    remove() {
        const dropdown = document.getElementById(this.dropdownId);
        if (dropdown) {
            dropdown.remove();
            document.removeEventListener('click', this.handleOutsideClick.bind(this));
        }
    }

    /**
     * Returns empty state HTML
     */
    private getEmptyStateHTML(customMessage?: string): string {
        return `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"/>
                </svg>
                <p class="text-sm">${customMessage || i18n.t('notifications.noNew')}</p>
                ${!customMessage ? '<p class="text-xs text-gray-400 mt-1">You\'re all caught up! 🎉</p>' : ''}
            </div>
        `;
    }

    /**
     * Returns error state HTML
     */
    private getErrorStateHTML(): string {
        return `
            <div class="text-center py-8 text-red-500">
                <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm">Failed to load notifications</p>
                <button class="mt-2 text-xs text-blue-600 hover:text-blue-800" onclick="location.reload()">Try again</button>
            </div>
        `;
    }
}