import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector/crop-farm-selector-toolbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CropFarmSelectorToolbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');
}
