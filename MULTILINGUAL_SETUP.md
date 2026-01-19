# Multilingual Support Implementation Guide

## Overview
Your Farm Web Portal now supports multiple languages including English and Kannada. Users can switch languages at runtime, and their preference is saved.

## Supported Languages
- **English** (en)
- **Kannada** (ಕನ್ನಡ) (kn)

---

## How to Use Translations in Components

### 1. In HTML Templates (Recommended)
Use the `translate` pipe to translate text:

```html
<h1>{{ 'header' | translate }}</h1>
<button>{{ 'common.save' | translate }}</button>
<p>{{ 'home.welcome' | translate }}</p>
```

### 2. In TypeScript Components
Inject the `TranslateService` to translate programmatically:

```typescript
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-component',
  template: `
    <h1>{{ title }}</h1>
  `
})
export class MyComponent implements OnInit {
  title: string = '';

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    this.translate.get('header').subscribe((res: string) => {
      this.title = res;
    });
  }
}
```

### 3. Using the Language Service
Import and use the `LanguageService` to manage language changes:

```typescript
import { Component } from '@angular/core';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-my-component',
  template: `
    <p>Current language: {{ languageService.getCurrentLanguage() }}</p>
  `
})
export class MyComponent {
  constructor(public languageService: LanguageService) {}
}
```

---

## Adding the Language Switcher to Your App

### In app.component.html
Add the language switcher to your app header or sidebar:

```html
<app-language-switcher></app-language-switcher>
```

### In app.component.ts
Import and add the component:

```typescript
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-root',
  imports: [
    // ... other imports
    LanguageSwitcherComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  // ... your code
}
```

---

## Translation File Structure

Translation files are located in `src/assets/i18n/`

### en.json (English)
```json
{
  "header": "Farm Web Portal",
  "navigation": {
    "dashboard": "Dashboard",
    "farmLookup": "Farm Lookup"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### kn.json (Kannada)
```json
{
  "header": "ಫಾರ್ಮ ವೆಬ್ ಪೋರ್ಟಲ್",
  "navigation": {
    "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "farmLookup": "ಫಾರ್ಮ್ ಹುಡುಕು"
  },
  "common": {
    "save": "ಉಳಿಸಿ",
    "cancel": "ರದ್ದುಮಾಡಿ"
  }
}
```

---

## Adding New Languages

To add support for more languages:

1. **Create a new translation file** in `src/assets/i18n/` (e.g., `hi.json` for Hindi)

2. **Update the LanguageService** in `src/app/services/language.service.ts`:

```typescript
private supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }  // Add this line
];
```

3. **Translate all strings** in the new JSON file to match the structure of `en.json` and `kn.json`

---

## Common Translation Keys

### Navigation
- `navigation.dashboard`
- `navigation.farmLookup`
- `navigation.cropRegistration`
- `navigation.farmRegistration`
- `navigation.inventory`
- `navigation.weather`
- `navigation.actions`
- `navigation.users`
- `navigation.userProfile`
- `navigation.logout`

### Common Actions
- `common.save`
- `common.cancel`
- `common.delete`
- `common.edit`
- `common.add`
- `common.search`
- `common.loading`
- `common.error`
- `common.success`

### Farm Management
- `farm.farmName`
- `farm.farmLocation`
- `farm.area`
- `farm.soilType`
- `farm.cropType`

### Crop Management
- `crop.cropName`
- `crop.plantingDate`
- `crop.expectedHarvestDate`

### Language Selection
- `common.language`
- `common.selectLanguage`
- `common.english`
- `common.kannada`

---

## Language Persistence

The selected language is automatically saved to `localStorage` under the key `selectedLanguage`. When users return to the app, their preferred language choice is restored.

---

## LanguageService Methods

| Method | Description |
|--------|-------------|
| `setLanguage(code: string)` | Set the current language |
| `getCurrentLanguage(): string` | Get the current language code |
| `getCurrentLanguageSignal()` | Get signal for reactive updates |
| `getLanguageChange(): Observable<string>` | Observable for language change events |
| `getSupportedLanguages()` | Get list of supported languages |
| `getLanguageName(code: string): string` | Get display name for a language |

---

## Example Component with Full Translation Support

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-farm-lookup',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="container">
      <h1>{{ 'navigation.farmLookup' | translate }}</h1>
      
      <div class="content">
        <label>{{ 'farm.farmName' | translate }}</label>
        <input type="text" placeholder="{{ 'common.search' | translate }}" />
        
        <button>{{ 'common.search' | translate }}</button>
      </div>
      
      <div class="current-lang">
        {{ 'common.language' | translate }}: {{ currentLanguage }}
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .current-lang {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
    }
  `]
})
export class FarmLookupComponent implements OnInit, OnDestroy {
  currentLanguage: string = 'en';
  private destroy$ = new Subject<void>();

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Set initial language name
    this.currentLanguage = this.languageService.getLanguageName(
      this.languageService.getCurrentLanguage()
    );

    // Subscribe to language changes
    this.languageService.getLanguageChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = this.languageService.getLanguageName(lang);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Browser Language Detection

The app automatically detects the user's browser language and uses it if supported. If the browser language isn't supported, it defaults to English.

## Testing Translations

To test if translations are working:

1. Check the browser console for any loading errors
2. Use the language switcher component to change languages
3. Verify that all UI text updates to the selected language
4. Refresh the page and confirm the language preference persists

---

## Troubleshooting

### Translations not loading?
- Ensure translation JSON files are in `src/assets/i18n/`
- Check that `HttpClientModule` is imported in `app.config.ts`
- Verify the translate pipe is imported: `import { TranslateModule } from '@ngx-translate/core'`

### Missing translations?
- Check if the translation key exists in both `en.json` and `kn.json`
- Use browser DevTools Network tab to verify JSON files are loaded
- Check browser console for any errors

### Language switcher not appearing?
- Ensure `LanguageSwitcherComponent` is imported in your component
- Verify `MatSelectModule` and `MatFormFieldModule` are available
- Check that `TranslateModule` is imported in the language switcher component

