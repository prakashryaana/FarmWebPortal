import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FarmOwnerRegistrationComponent } from './farm-owner-registration/farm-owner-registration.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FarmOwnerRegistrationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');
}
