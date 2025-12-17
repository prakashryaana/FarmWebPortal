import { Component } from '@angular/core';
import { WebAuthnService } from './web-authn.service';

@Component({
  selector: 'app-enable-fingerprint',
  templateUrl: './enable-fingerprint.component.html'
})
export class EnableFingerprintComponent {
  message = '';
  canUseBiometric = !!(window as any).PublicKeyCredential;

  constructor(private webAuthn: WebAuthnService) {}

  async enable() {
    try {
      await this.webAuthn.registerForCurrentUser();
      this.message = 'Fingerprint registered for this device.';
    } catch (e: any) {
      this.message = e.message || 'Failed to register fingerprint';
    }
  }
}
