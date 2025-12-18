import { Component } from '@angular/core';
import { AuthService } from '../login/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-magic-request',
  imports : [FormsModule],
  templateUrl: './magic-request.component.html'
})
export class MagicRequestComponent {
  email = '';
  message = '';

  constructor(private authApi: AuthService) {}

  sendLink() {
    this.authApi.requestMagicLink(this.email).subscribe({
      next: () => this.message = 'If an account exists, a sign-in link has been sent.',
      error: err => this.message = err.error || 'Failed to send link'
    });
  }
}
