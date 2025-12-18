import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector/crop-farm-selector-toolbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthTokenService } from './login/auth-token.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CropFarmSelectorToolbarComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');

  constructor(private auth:AuthTokenService) {}

  get isLoggedIn() {
    return !!this.auth.token;
  }
}
