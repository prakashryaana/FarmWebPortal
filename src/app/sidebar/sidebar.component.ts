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
    { label: 'Add Actions', route: '/add-actions', icon: 'add_circle' },
    { label: 'View Actions', route: '/view-actions', icon: 'list' },
    { label: 'Manage Users', route: '/user-management', icon: 'group' },
    { label: 'Manage Crop Master', route: '/crop-master', icon: 'group' },
    { label: 'Manage Fertilizer Inventory', route: '/fertilizer-inventory', icon: 'group' },
    { label: 'Manage Disease Control Inventory', route: '/disease-control-inventory', icon: 'group' },
  ];

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }
}
