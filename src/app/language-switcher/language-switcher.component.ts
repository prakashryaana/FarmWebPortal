import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, TranslateModule],
  template: `
    <mat-form-field appearance="outline" class="language-selector">
      <mat-label>{{ 'common.selectLanguage' | translate }}</mat-label>
      <mat-select 
        [value]="languageService.getCurrentLanguage()"
        (selectionChange)="onLanguageChange($event.value)"
      >
        <mat-option *ngFor="let lang of languageService.getSupportedLanguages()" [value]="lang.code">
          {{ lang.nativeName }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: [`
    .language-selector {
      min-width: 150px;
      max-width: 200px;
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  constructor(public languageService: LanguageService) {}

  ngOnInit(): void {
    // Language selection is managed by the service
  }

  onLanguageChange(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
  }
}
