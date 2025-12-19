import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WebAuthnService } from '../enable-fingerprint/web-authn.service';
import { FormsModule, ReactiveFormsModule, FormGroup,Validators,FormControl } from '@angular/forms';
import { AuthService } from './auth.service';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardModule, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { AuthTokenService } from './auth-token.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  imports:[MatCard,MatCardHeader,MatCardTitle,MatCardContent,MatIcon,MatCardSubtitle,MatFormField,MatLabel,MatCardActions
    ,CommonModule,ReactiveFormsModule,RouterLink,MatCardModule,MatFormFieldModule,MatInputModule,MatButtonModule,MatIconModule,MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  mobile = '';
  password = '';
  isLoading = false;
  showPassword = false;
  canUsePasskey = !!(window as any).PublicKeyCredential;
  message = '';
  loginForm!: FormGroup;
  canUseMagicLinks = false;

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

  ngOnInit() {
    this.loginForm = new FormGroup({
      mobile: new FormControl('', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });
  }

  async loginWithPassword(){
    if (this.loginForm.valid){
      this.authService.loginWithPassword(this.loginForm.get('mobile').value, this.loginForm.get('password').value).subscribe({
        next: () => this.router.navigate(['/home-dashboard']),
        error: err => this.message = err.error || 'Invalid credentials'
      });
    }
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
