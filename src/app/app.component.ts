import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector/crop-farm-selector-toolbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CropFarmSelectorToolbarComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');
}
