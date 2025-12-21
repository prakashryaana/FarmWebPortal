import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector/crop-farm-selector-toolbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from './auth/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CropFarmSelectorToolbarComponent, SidebarComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');

  constructor(public auth:AuthService) {}

  logout(){
    this.auth.logout();
  }
}
