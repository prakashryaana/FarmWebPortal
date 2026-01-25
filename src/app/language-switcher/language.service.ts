import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
//   private currentLanguage = signal<string>(this.getInitialLanguage());
//   private languageChange$ = new BehaviorSubject<string>(this.currentLanguage());
    private currentLanguage = signal<string>('en'); // Default to 'en'
    private languageChange$ = new BehaviorSubject<string>('en');

  private supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
  ];

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  private getInitialLanguage(): string {
    // Check localStorage first
    const saved = localStorage.getItem('selectedLanguage');
    if (saved && this.isLanguageSupported(saved)) {
      return saved;
    }

    // Fall back to browser language if supported
    //const browserLang = this.translate.getBrowserLang();

    // Use navigator.language instead of translate.getBrowserLang()
    const browserLang = navigator.language.slice(0, 2); // 'kn', 'en', etc.
    if (browserLang && this.isLanguageSupported(browserLang)) {
      return browserLang;
    }

    // Default to English
    return 'en';
  }

  private initializeLanguage(): void {
    // const lang = this.currentLanguage();
    // this.translate.setDefaultLang('en');
    // this.translate.use(lang);

    const lang = this.getInitialLanguage();
    
    this.translate.addLangs(['en', 'kn']);
    this.translate.setDefaultLang('en');
    
    // Update signal after language is set
    this.currentLanguage.set(lang);
    this.languageChange$.next(lang);
    
    // Apply language
    this.translate.use(lang);
  }

  setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguage.set(languageCode);
      this.translate.use(languageCode);
      localStorage.setItem('selectedLanguage', languageCode);
      this.languageChange$.next(languageCode);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage();
  }

  getCurrentLanguageSignal() {
    return this.currentLanguage;
  }

  getLanguageChange(): Observable<string> {
    return this.languageChange$.asObservable();
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  private isLanguageSupported(lang: string): boolean {
    return this.supportedLanguages.some(l => l.code === lang);
  }

  getLanguageName(code: string): string {
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang ? lang.nativeName : code;
  }
}
