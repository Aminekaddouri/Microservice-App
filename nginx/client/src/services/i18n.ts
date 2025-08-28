export type SupportedLanguage = 'en' | 'fr' | 'es' | 'fi';

export interface TranslationKeys {
  // Navigation
  nav: {
    dashboard: string;
    chat: string;
    profile: string;
    tournament: string;
    logout: string;
  };
  
  // Authentication
  auth: {
    login: string;
    signup: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    nickName: string;
    forgotPassword: string;
    rememberMe: string;
    signInWith: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    createAccount: string;
    signIn: string;
    checkYourEmail: string;
    emailSent: string;
    resendEmail: string;
  };
  
  // Dashboard
  dashboard: {
    welcome: string;
    recentGames: string;
    friends: string;
    tournaments: string;
    statistics: string;
    noRecentGames: string;
    playNow: string;
    viewProfile: string;
  };
  
  // Chat
  chat: {
    selectFriend: string;
    typeMessage: string;
    online: string;
    offline: string;
    clearConversation: string;
    chatInfo: string;
    noMessages: string;
    messagePlaceholder: string;
  };
  
  // Profile
  profile: {
    editProfile: string;
    personalInfo: string;
    gameStats: string;
    achievements: string;
    settings: string;
    save: string;
    cancel: string;
    changeAvatar: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    confirm: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    sort: string;
    language: string;
  };
  
  // Errors
  errors: {
    networkError: string;
    serverError: string;
    validationError: string;
    authenticationError: string;
    notFound: string;
    forbidden: string;
    tryAgain: string;
  };
}

class I18nService {
  private currentLanguage: SupportedLanguage = 'en';
  private translations: Record<SupportedLanguage, TranslationKeys> = {} as any;
  private listeners: Array<(language: SupportedLanguage) => void> = [];
  private translationsLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  
  constructor() {
    this.loadingPromise = this.loadTranslations();
    this.detectLanguage();
  }
  
  private async loadTranslations(): Promise<void> {
    try {
      // Dynamic imports for better code splitting
      const [en, fr, es, fi] = await Promise.all([
        import('../locales/en.json'),
        import('../locales/fr.json'),
        import('../locales/es.json'),
        import('../locales/fi.json')
      ]);
      
      this.translations = {
        en: en.default,
        fr: fr.default,
        es: es.default,
        fi: fi.default
      };
      
      this.translationsLoaded = true;
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English if translations fail to load
      this.currentLanguage = 'en';
      this.translationsLoaded = true; // Mark as loaded even on error
    }
  }
  
  public async waitForTranslations(): Promise<void> {
    if (this.loadingPromise) {
      await this.loadingPromise;
    }
  }
  
  public isReady(): boolean {
    return this.translationsLoaded;
  }
  
  private detectLanguage() {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('preferred-language') as SupportedLanguage;
    if (savedLanguage && this.isValidLanguage(savedLanguage)) {
      this.currentLanguage = savedLanguage;
      return;
    }
    
    // Check browser language
    const browserLanguage = navigator.language.split('-')[0] as SupportedLanguage;
    if (this.isValidLanguage(browserLanguage)) {
      this.currentLanguage = browserLanguage;
    } else {
      this.currentLanguage = 'en'; // Default fallback
    }
    
    // Save detected language
    this.saveLanguagePreference(this.currentLanguage);
  }
  
  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return ['en', 'fr', 'es', 'fi'].includes(lang);
  }
  
  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }
  
  public setLanguage(language: SupportedLanguage) {
    if (!this.isValidLanguage(language)) {
      console.warn(`Unsupported language: ${language}`);
      return;
    }
    
    this.currentLanguage = language;
    this.saveLanguagePreference(language);
    this.notifyListeners(language);
  }
  
  private saveLanguagePreference(language: SupportedLanguage) {
    localStorage.setItem('preferred-language', language);
  }
  
  public translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = this.translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key; // Return the key itself as fallback
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }
  
  public t = this.translate.bind(this);
  
  public onLanguageChange(callback: (language: SupportedLanguage) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(language: SupportedLanguage) {
    this.listeners.forEach(callback => callback(language));
  }
  
  public getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi' }
    ];
  }
}

// Export singleton instance
export const i18n = new I18nService();

// Export convenience function for use in templates
export const t = i18n.t;