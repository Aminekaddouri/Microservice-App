import { i18n, SupportedLanguage } from '../services/i18n';

export interface LanguageSwitcherProps {
  onLanguageChange?: (language: SupportedLanguage) => void;
  className?: string;
}

export class LanguageSwitcher {
  private container: HTMLElement;
  private props: LanguageSwitcherProps;
  private currentLanguage: SupportedLanguage;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement, props: LanguageSwitcherProps = {}) {
    this.container = container;
    this.props = props;
    this.currentLanguage = i18n.getCurrentLanguage();
    
    this.render();
    this.setupEventListeners();
    
    // Listen for language changes from other components
    this.unsubscribe = i18n.onLanguageChange((language) => {
      this.currentLanguage = language;
      this.updateActiveLanguage();
    });
  }

  private render() {
    const languages = i18n.getSupportedLanguages();
    
    this.container.innerHTML = `
      <div class="language-switcher relative ${this.props.className || ''}">
        <button 
          id="language-dropdown-btn"
          class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
          aria-label="${i18n.t('common.language')}"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
          </svg>
          <span id="current-language-name">${this.getCurrentLanguageName()}</span>
          <svg class="w-4 h-4 transition-transform duration-200" id="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div 
          id="language-dropdown"
          class="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50 opacity-0 invisible transform scale-95 transition-all duration-200"
        >
          <div class="py-2">
            ${languages.map(lang => `
              <button 
                class="language-option w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150 flex items-center justify-between"
                data-language="${lang.code}"
                ${lang.code === this.currentLanguage ? 'data-active="true"' : ''}
              >
                <div class="flex items-center space-x-3">
                  <span class="text-lg">${this.getLanguageFlag(lang.code)}</span>
                  <div>
                    <div class="font-medium">${lang.nativeName}</div>
                    <div class="text-xs text-white/50">${lang.name}</div>
                  </div>
                </div>
                <svg class="w-4 h-4 text-green-400 ${lang.code === this.currentLanguage ? 'opacity-100' : 'opacity-0'}" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private getCurrentLanguageName(): string {
    const languages = i18n.getSupportedLanguages();
    const current = languages.find(lang => lang.code === this.currentLanguage);
    return current ? current.nativeName : 'English';
  }

  private getLanguageFlag(code: SupportedLanguage): string {
    const flags: Record<SupportedLanguage, string> = {
      'en': '🇺🇸',
      'fr': '🇫🇷',
      'es': '🇪🇸'
    };
    return flags[code] || '🌐';
  }

  private setupEventListeners() {
    const dropdownBtn = this.container.querySelector('#language-dropdown-btn');
    const dropdown = this.container.querySelector('#language-dropdown');
    const arrow = this.container.querySelector('#dropdown-arrow');
    
    if (!dropdownBtn || !dropdown || !arrow) return;

    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Language selection
    const languageOptions = this.container.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const language = (e.currentTarget as HTMLElement).dataset.language as SupportedLanguage;
        if (language) {
          this.selectLanguage(language);
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
      }
    });
  }

  private toggleDropdown() {
    const dropdown = this.container.querySelector('#language-dropdown');
    const arrow = this.container.querySelector('#dropdown-arrow');
    
    if (!dropdown || !arrow) return;

    const isOpen = dropdown.classList.contains('opacity-100');
    
    if (isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown() {
    const dropdown = this.container.querySelector('#language-dropdown');
    const arrow = this.container.querySelector('#dropdown-arrow');
    
    if (!dropdown || !arrow) return;

    dropdown.classList.remove('opacity-0', 'invisible', 'scale-95');
    dropdown.classList.add('opacity-100', 'visible', 'scale-100');
    arrow.classList.add('rotate-180');
  }

  private closeDropdown() {
    const dropdown = this.container.querySelector('#language-dropdown');
    const arrow = this.container.querySelector('#dropdown-arrow');
    
    if (!dropdown || !arrow) return;

    dropdown.classList.remove('opacity-100', 'visible', 'scale-100');
    dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
    arrow.classList.remove('rotate-180');
  }

  private selectLanguage(language: SupportedLanguage) {
    if (language === this.currentLanguage) {
      this.closeDropdown();
      return;
    }

    // Update i18n service
    i18n.setLanguage(language);
    
    // Update local state
    this.currentLanguage = language;
    
    // Update UI
    this.updateActiveLanguage();
    this.updateCurrentLanguageName();
    
    // Close dropdown
    this.closeDropdown();
    
    // Notify parent component
    if (this.props.onLanguageChange) {
      this.props.onLanguageChange(language);
    }

    // Show success message
    this.showLanguageChangeNotification(language);
  }

  private updateActiveLanguage() {
    const options = this.container.querySelectorAll('.language-option');
    options.forEach(option => {
      const language = (option as HTMLElement).dataset.language;
      const checkIcon = option.querySelector('svg');
      
      if (language === this.currentLanguage) {
        option.setAttribute('data-active', 'true');
        checkIcon?.classList.remove('opacity-0');
        checkIcon?.classList.add('opacity-100');
      } else {
        option.removeAttribute('data-active');
        checkIcon?.classList.remove('opacity-100');
        checkIcon?.classList.add('opacity-0');
      }
    });
  }

  private updateCurrentLanguageName() {
    const nameElement = this.container.querySelector('#current-language-name');
    if (nameElement) {
      nameElement.textContent = this.getCurrentLanguageName();
    }
  }

  private showLanguageChangeNotification(language: SupportedLanguage) {
    const languages = i18n.getSupportedLanguages();
    const selectedLang = languages.find(lang => lang.code === language);
    
    if (!selectedLang) return;

    // Create notification at bottom
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 flex items-center space-x-2 translate-y-full';
    notification.innerHTML = `
      <span>${this.getLanguageFlag(language)}</span>
      <span>Language changed to ${selectedLang.nativeName}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(-50%) translateY(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  public updateProps(newProps: Partial<LanguageSwitcherProps>) {
    this.props = { ...this.props, ...newProps };
  }

  public destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}