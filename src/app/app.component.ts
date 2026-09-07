import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector/crop-farm-selector-toolbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from './auth/auth.service';
import { AsyncPipe } from '@angular/common';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatIcon } from "@angular/material/icon";
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const HIDDEN_SELECTOR_ROUTES = [
  '/farm-registration',
  '/farm-owner-registration',
  '/maintainer-registration',
  '/user-management',
  '/crop-master',
  '/fertilizer-master',
  '/disease-control-master'
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CropFarmSelectorToolbarComponent, SidebarComponent, AsyncPipe, LanguageSwitcherComponent, TranslateModule, MatIcon],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');
  showCropFarmSelector = signal<boolean>(true);

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  constructor(public auth: AuthService) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event: NavigationEnd) => {
        this.updateSelectorVisibility(event.urlAfterRedirects || event.url);
      });

    this.updateSelectorVisibility(this.router.url);
  }

  private updateSelectorVisibility(url: string): void {
    const cleanUrl = (url || '').split('?')[0].split('#')[0];
    const isHiddenByPath = HIDDEN_SELECTOR_ROUTES.some(
      route => cleanUrl === route || cleanUrl.startsWith(route + '/')
    );

    let currentRoute: ActivatedRoute | null = this.activatedRoute.root;
    let isHiddenByData = false;
    while (currentRoute) {
      if (currentRoute.snapshot.data?.['hideCropFarmSelector']) {
        isHiddenByData = true;
        break;
      }
      currentRoute = currentRoute.firstChild;
    }

    this.showCropFarmSelector.set(!isHiddenByPath && !isHiddenByData);
  }

  logout(){
    this.auth.logout();
  }
}

