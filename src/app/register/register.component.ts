import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../login/auth.service';
import { WebAuthnService } from '../enable-fingerprint/web-authn.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardModule, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MAT_BUTTON_CONFIG, MatButton, MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { AuthTokenService } from '../login/auth-token.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AbstractControl } from '@angular/forms';
import { ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports : [ReactiveFormsModule,MatCard,MatCardHeader,MatCardTitle,
    MatCardContent,MatIcon,MatCardSubtitle,MatFormField,MatLabel,MatCardActions
    ,MatButton,MatButtonToggleModule,MatFormFieldModule,MatInputModule
  ,MatButtonModule,RouterLink,CommonModule,MatCardModule,MatFormFieldModule
  ,MatInputModule,MatButtonModule,MatIconModule,MatSelectModule,MatProgressSpinnerModule,MatSnackBarModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  // mobile = '';
  // email = '';
  // password = '';
  // confirmPassword = '';
  asOwner = true;
  ownerId = '';
  message = '';
  canUsePasskey = !!(window as any).PublicKeyCredential;
  registrationForm!: FormGroup;
  error = false;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  private snackBar = inject(MatSnackBar);

  

  constructor(
    private authApi: AuthService,
    private webAuthn: WebAuthnService,
    private authTokenService: AuthTokenService,
    private router: Router
  ) {
    if (this.authTokenService.getCurrentUser()){
      this.router.navigate(['/home-dashboard']);
    }
  }

  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      mobile: new FormControl('', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]),
      email: new FormControl('', [Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required])
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator = (form: AbstractControl): ValidationErrors | null => {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  register() {
    if (this.registrationForm.valid){
    if (!this.registrationForm.get('password')?.value || this.registrationForm.get('password')?.value !== this.registrationForm.get('confirmPassword')?.value) {
      this.message = 'Passwords do not match';
      return;
    }

    this.authApi.registerWithPassword(
      this.registrationForm.get('mobile')?.value,
      this.registrationForm.get('password')?.value,
      this.registrationForm.get('email')?.value || undefined,
      this.asOwner,
      this.asOwner ? undefined : this.ownerId
    ).subscribe({
      next: () => this.onSuccess(),
      error: (err) => this.onError(err)
    });
  }
  }

   private onSuccess() {
    this.isLoading = false;
    this.message = 'Account created successfully! You can now sign in.';
    this.error = false;
    this.snackBar.open('Registration successful!', 'Close', { duration: 4000 });
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }

  private onError(err: any) {
    this.isLoading = false;
    //this.message = err.error || 'Registration failed';
    this.message = err.error?.message || 'Registration failed. Please try again.';
    this.error = true;
    this.snackBar.open('Registration failed', 'Close', { duration: 4000 });
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

  
}
