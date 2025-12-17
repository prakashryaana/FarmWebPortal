import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { WebAuthnService } from '../enable-fingerprint/web-authn.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  mobile = '';
  otp = '';
  stage: 'mobile' | 'otp' = 'mobile';
  message = '';
  canUseBiometric = !!(window as any).PublicKeyCredential;

  constructor(
    private auth: AuthService,
    private webAuthn: WebAuthnService
  ) {}

  sendOtp() {
    this.auth.sendOtp(this.mobile).subscribe({
      next: () => {
        this.stage = 'otp';
        this.message = 'OTP sent';
      },
      error: err => this.message = err.error || 'Error sending OTP'
    });
  }

  verifyOtp() {
    this.auth.verifyOtp(this.mobile, this.otp).subscribe({
      next: () => {
        this.message = 'Logged in; you can now enable fingerprint on settings.';
      },
      error: err => this.message = err.error || 'Invalid OTP'
    });
  }

  async biometricLogin() {
    try {
      await this.webAuthn.loginWithBiometric(this.mobile);
      this.message = 'Logged in with fingerprint';
    } catch (e: any) {
      this.message = e.message || 'Biometric login failed';
    }
  }
}
