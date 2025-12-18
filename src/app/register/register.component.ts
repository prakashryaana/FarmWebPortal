import { Component } from '@angular/core';
import { AuthService } from '../login/auth.service';
import { WebAuthnService } from '../enable-fingerprint/web-authn.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MAT_BUTTON_CONFIG, MatButton, MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-register',
  imports : [ReactiveFormsModule,MatCard,MatCardHeader,MatCardTitle,
    MatCardContent,MatIcon,MatCardSubtitle,MatFormField,MatLabel,MatCardActions
    ,MatButton,MatButtonToggleModule,MatFormFieldModule,MatInputModule
  ,MatButtonModule,RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  // mobile = '';
  // email = '';
  // password = '';
  // confirmPassword = '';
  asOwner = true;
  ownerId = '';
  message = '';
  canUsePasskey = !!(window as any).PublicKeyCredential;

  registrationForm = new FormGroup({
    mobile: new FormControl('', [Validators.required]),
    email: new FormControl(''),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  constructor(
    private authApi: AuthService,
    private webAuthn: WebAuthnService,
    private router: Router
  ) {}


  register() {
    if (this.registrationForm.valid){
    if (!this.registrationForm.controls.password.value || this.registrationForm.controls.password.value !== this.registrationForm.controls.confirmPassword.value) {
      this.message = 'Passwords do not match';
      return;
    }

    this.authApi.registerWithPassword(
      this.registrationForm.controls.mobile.value,
      this.registrationForm.controls.password.value,
      this.registrationForm.controls.email.value || undefined,
      this.asOwner,
      this.asOwner ? undefined : this.ownerId
    ).subscribe({
      next: () => {
        this.message = 'Registered. You can now create a passkey on this device.';
        this.router.navigate(['/login']);
      },
      error: err => this.message = err.error || 'Registration failed'
    });
  }
  }

  // register() {
  //   if (!this.password || this.password !== this.confirmPassword) {
  //     this.message = 'Passwords do not match';
  //     return;
  //   }

  //   this.authApi.registerWithPassword(
  //     this.mobile,
  //     this.password,
  //     this.email || undefined,
  //     this.asOwner,
  //     this.asOwner ? undefined : this.ownerId
  //   ).subscribe({
  //     next: () => this.message = 'Registered. You can now create a passkey on this device.',
  //     error: err => this.message = err.error || 'Registration failed'
  //   });
  // }

  async enablePasskey() {
    try {
      await this.webAuthn.registerForCurrentUser();
      this.message = 'Passkey registered for this device.';
      this.router.navigate(['/login']);
    } catch (e: any) {
      this.message = e.message || 'Passkey registration failed';
    }
  }
}
