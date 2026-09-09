import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserProfileService } from './user-profile.service';
import { UserProfile } from './user-profile.service';
import { UserService } from '../users/user.service';
import { AuthService } from '../auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userProfileService = inject(UserProfileService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  profileForm = signal<FormGroup | null>(null);
  userProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  isUpdating = signal(false);
  updateSuccess = signal(false);

  showOldPassword = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  passwordMatchValidator = (form: AbstractControl): ValidationErrors | null => {
    const changePassword = form.get('changePassword')?.value;
    if (!changePassword) return null;

    const oldPassword = form.get('oldPassword')?.value;
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    const errors: ValidationErrors = {};

    if (password && confirmPassword && password !== confirmPassword) {
      errors['passwordMismatch'] = true;
    }

    if (oldPassword && password && oldPassword === password) {
      errors['sameAsOldPassword'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  ngOnInit() {
    const form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobile: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      changePassword: [false],
      oldPassword: [''],
      password: [''],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });

    this.profileForm.set(form);

    form.get('changePassword')?.valueChanges.subscribe(checked => {
      const oldPasswordCtrl = form.get('oldPassword');
      const passwordCtrl = form.get('password');
      const confirmPasswordCtrl = form.get('confirmPassword');

      if (checked) {
        oldPasswordCtrl?.setValidators([Validators.required]);
        passwordCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
        confirmPasswordCtrl?.setValidators([Validators.required]);
      } else {
        oldPasswordCtrl?.clearValidators();
        passwordCtrl?.clearValidators();
        confirmPasswordCtrl?.clearValidators();
        oldPasswordCtrl?.setValue('');
        passwordCtrl?.setValue('');
        confirmPasswordCtrl?.setValue('');
      }

      oldPasswordCtrl?.updateValueAndValidity();
      passwordCtrl?.updateValueAndValidity();
      confirmPasswordCtrl?.updateValueAndValidity();
    });

    form.get('oldPassword')?.valueChanges.subscribe(() => {
      const oldPasswordCtrl = form.get('oldPassword');
      if (oldPasswordCtrl?.hasError('incorrect')) {
        const errors = { ...oldPasswordCtrl.errors };
        delete errors['incorrect'];
        oldPasswordCtrl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    });

    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.userProfileService.getMyProfile().pipe(
      tap(profile => {
        this.userProfile.set(profile);
        this.profileForm()?.patchValue({
          name: profile.name,
          mobile: profile.mobile,
          email: profile.email
        });
      }),
      catchError(error => {
        console.error('Failed to load profile:', error);
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  onSubmit() {
    if (this.profileForm()!.invalid) return;

    this.isUpdating.set(true);
    this.updateSuccess.set(false);

    const formValue = this.profileForm()!.getRawValue();
    const profileData = {
      name: formValue.name,
      email: formValue.email,
      mobile: formValue.mobile
    };

    const currentMobile = this.userProfile()?.mobile || formValue.mobile;

    if (formValue.changePassword) {
      // Step 1: Validate old password with login API first
      this.authService.loginWithPassword({
        mobile: currentMobile,
        password: formValue.oldPassword
      }).pipe(
        switchMap(() => {
          // Old password verified! Update new password
          return this.userService.setTempPassword(this.userProfile()!.userId, formValue.password);
        }),
        switchMap(() => {
          // Update profile details
          return this.userProfileService.updateMyProfile(profileData);
        }),
        tap(() => {
          this.userProfile.update(profile => 
            profile ? { ...profile, ...profileData } : profile
          );
          this.profileForm()?.patchValue({
            changePassword: false,
            oldPassword: '',
            password: '',
            confirmPassword: ''
          });
          this.updateSuccess.set(true);
          this.snackBar.open('Profile and password updated successfully', 'Close', {
            duration: 4000,
            panelClass: ['centered-success-snackbar']
          });
        }),
        catchError(error => {
          console.error('Update failed:', error);
          if (error.status === 401 || error.status === 400) {
            this.profileForm()?.get('oldPassword')?.setErrors({ incorrect: true });
            this.profileForm()?.get('oldPassword')?.markAsTouched();
            this.snackBar.open('Old password is incorrect. Please try again.', 'Close', { duration: 4000 });
          } else {
            this.snackBar.open(error.message || 'Update failed', 'Close', { duration: 4000 });
          }
          return of(null);
        }),
        finalize(() => this.isUpdating.set(false))
      ).subscribe();
    } else {
      this.userProfileService.updateMyProfile(profileData).pipe(
        tap(() => {
          this.userProfile.update(profile => 
            profile ? { ...profile, ...profileData } : profile
          );
          this.updateSuccess.set(true);
          this.snackBar.open('Profile updated successfully', 'Close', {
            duration: 4000,
            panelClass: ['centered-success-snackbar']
          });
        }),
        catchError(error => {
          console.error('Update failed:', error);
          this.snackBar.open(error.message || 'Update failed', 'Close', { duration: 4000 });
          return of(null);
        }),
        finalize(() => this.isUpdating.set(false))
      ).subscribe();
    }
  }

  get saveButtonLabel(): string  {
    return this.isUpdating() ? 'Updating...' : 'userProfile.saveChanges'
  }
}
