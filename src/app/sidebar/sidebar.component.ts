// sidebar.component.ts
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isCollapsed = signal(false);

  menuItems: MenuItem[] = [
    { label: 'On-boarding', route: '/farm-registration', icon: 'business' },
    { label: 'Setup Crop', route: '/crop-registration', icon: 'agriculture' },
    { label: 'Add Activity', route: '/add-activity', icon: 'add_circle' },
    { label: 'View Activities', route: '/list-activity', icon: 'list' },
    { label: 'Manage Users', route: '/user-management', icon: 'group' },
  ];

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }
}
