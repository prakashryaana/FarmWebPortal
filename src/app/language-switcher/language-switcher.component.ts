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
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
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
