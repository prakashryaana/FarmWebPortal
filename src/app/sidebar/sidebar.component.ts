// sidebar.component.ts
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserProfileService, UserProfile } from '../user-profile/user-profile.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { MatProgressSpinnerModule, MatSpinner } from '@angular/material/progress-spinner';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../users/user.model';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  submenu?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule,
    TranslateModule, LanguageSwitcherComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isCollapsed = signal(false);
  expandedMenus = signal<string[]>([]);
  isLoading = signal(false);
  userProfile = signal<UserProfile | null>(null);
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);

  menuItems: MenuItem[] = [];

  constructor(private router: Router, private auth: AuthService) {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading.set(true);
    this.userProfileService.getMyProfile().subscribe({
      next: profile => {
        this.userProfile.set(profile);
        this.setMenuByRole();
      },
      error: () => {
        this.userProfile.set(null)
        this.setMenuByRole();
      },
      complete: () => this.isLoading.set(false)
    });
  }

  setMenuByRole() {
    if (this.authService.hasRole('FARMOWNER')) {
      this.menuItems = [
        //{ label: 'navigation.setupCrop', route: '/crop-registration', icon: 'grass' },
        { label: 'actions.addAction', route: '/add-actions', icon: 'add_circle' },
        { label: 'actions.viewActions', route: '/view-actions', icon: 'list' }
      ];
    } else if (this.authService.hasRole('FARMHELP')) {
      this.menuItems = [
        { label: 'actions.addAction', route: '/add-actions', icon: 'add_circle' },
        { label: 'actions.viewActions', route: '/view-actions', icon: 'list' }
      ];
    } else if (this.authService.hasRole('EASYGROWADMIN')) {
      this.menuItems = [
        { label: 'navigation.farmOwnerRegistration', route: '/farm-owner-registration', icon: 'person_add' },
        { label: 'navigation.farmHelpRegistration', route: '/maintainer-registration', icon: 'person_add' },
        { label: 'navigation.farmRegistration', route: '/farm-registration', icon: 'agriculture' },
        { label: 'navigation.setupCrop', route: '/crop-registration', icon: 'grass' },
        { label: 'actions.addAction', route: '/add-actions', icon: 'add_circle' },
        { label: 'actions.viewActions', route: '/view-actions', icon: 'list' },
        // {
        //   label: 'Manage',
        //   icon: 'settings',
        //   submenu: [
        { label: 'navigation.manageUsers', route: '/user-management', icon: 'group' },
        { label: 'navigation.manageCropMaster', route: '/crop-master', icon: 'local_florist' },
        { label: 'navigation.manageFertilizerInventory', route: '/fertilizer-inventory', icon: 'grain' },
        { label: 'navigation.manageDiseaseControlInventory', route: '/disease-control-inventory', icon: 'medical_services' }
        //   ]
        // }
      ];
    } else {
      //UNKNOWN role don't show anything
      this.menuItems = [];
    }
  }

  goToProfile() {
    this.router.navigate(['/user-profile']);
  }

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }

  toggleSubmenu(menuLabel: string) {
    this.expandedMenus.update(expanded => {
      if (expanded.includes(menuLabel)) {
        return expanded.filter(m => m !== menuLabel);
      } else {
        return [...expanded, menuLabel];
      }
    });
  }

  isMenuExpanded(menuLabel: string): boolean {
    return this.expandedMenus().includes(menuLabel);
  }

  logout() {
    this.auth.logout();
  }
}
