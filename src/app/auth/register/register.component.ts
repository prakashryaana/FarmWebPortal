import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardModule, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterComponent implements OnInit {
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
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(5)]),
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
      this.registrationForm.get('name')?.value,
      this.registrationForm.get('mobile')?.value,
      this.registrationForm.get('password')?.value,
      this.registrationForm.get('email')?.value || undefined
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
    this.message = err.error?.message || 'Registration failed. Please try again.';
    this.error = true;
    this.snackBar.open('Registration failed', 'Close', { duration: 4000 });
  }  
}
