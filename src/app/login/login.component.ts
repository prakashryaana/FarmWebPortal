import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { WebAuthnService } from '../enable-fingerprint/web-authn.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { AuthTokenService } from './auth-token.service';

@Component({
  selector: 'app-login',
  imports:[FormsModule,MatCard,MatCardHeader,MatCardTitle,MatCardContent,MatIcon,MatCardSubtitle,MatFormField,MatLabel,MatCardActions],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  mobile = '';
  password = '';
  canUsePasskey = !!(window as any).PublicKeyCredential;
  message = '';

  constructor(
    private webAuthn: WebAuthnService,
    private authService: AuthService,
    private authTokenService: AuthTokenService,
    private router: Router
  ) {
    if (this.authTokenService.getCurrentUser()){
      this.router.navigate(['/home-dashboard']);
    }
  }

  async loginWithPassword(){
    this.authService.loginWithPassword(this.mobile, this.password).subscribe({
      next: () => this.router.navigate(['/home-dashboard']),
      error: err => this.message = err.error || 'Invalid credentials'
    });
  }

  async enablePasskey() {
    try {
      await this.webAuthn.registerForCurrentUser();
      this.message = 'Passkey registered for this device.';
      this.router.navigate(['/login']);
    } catch (e: any) {
      this.message = e.message || 'Passkey registration failed';
    }
  }

  async loginWithPasskey() {
    try {
      await this.webAuthn.loginWithPasskey(this.mobile);
      this.router.navigate(['/home-dashboard']);
    } catch (e: any) {
      this.message = e.message || 'Passkey login failed';
    }
  }

  goToMagic() {
    this.router.navigate(['/magic-request']);
  }
}
