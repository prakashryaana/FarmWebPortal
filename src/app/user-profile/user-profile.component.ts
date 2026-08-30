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
  private snackBar = inject(MatSnackBar);

  profileForm = signal<FormGroup | null>(null);
  userProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  isUpdating = signal(false);
  updateSuccess = signal(false);

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  passwordMatchValidator = (form: AbstractControl): ValidationErrors | null => {
    const changePassword = form.get('changePassword')?.value;
    if (!changePassword) return null;

    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  ngOnInit() {
    const form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobile: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      changePassword: [false],
      password: [''],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });

    this.profileForm.set(form);

    form.get('changePassword')?.valueChanges.subscribe(checked => {
      const passwordCtrl = form.get('password');
      const confirmPasswordCtrl = form.get('confirmPassword');

      if (checked) {
        passwordCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
        confirmPasswordCtrl?.setValidators([Validators.required]);
      } else {
        passwordCtrl?.clearValidators();
        confirmPasswordCtrl?.clearValidators();
        passwordCtrl?.setValue('');
        confirmPasswordCtrl?.setValue('');
      }

      passwordCtrl?.updateValueAndValidity();
      confirmPasswordCtrl?.updateValueAndValidity();
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

    this.userProfileService.updateMyProfile(profileData).pipe(
      tap(() => {
        this.userProfile.update(profile => 
          profile ? { ...profile, ...profileData } : profile
        );
      }),
      switchMap(() => {
        if (formValue.changePassword) {
          return this.userService.setTempPassword(this.userProfile()!.userId, formValue.password).pipe(
            tap(() => {
              this.profileForm()?.patchValue({
                changePassword: false,
                password: '',
                confirmPassword: ''
              });
              this.snackBar.open('Profile and password updated successfully', 'Close', {
                duration: 4000,
                panelClass: ['centered-success-snackbar']
              });
            })
          );
        } else {
          this.snackBar.open('Profile updated successfully', 'Close', {
            duration: 4000,
            panelClass: ['centered-success-snackbar']
          });
          return of(null);
        }
      }),
      tap(() => {
        this.updateSuccess.set(true);
      }),
      catchError(error => {
        console.error('Update failed:', error);
        this.snackBar.open(error.message || 'Update failed', 'Close', { duration: 4000 });
        return of(null);
      }),
      finalize(() => this.isUpdating.set(false))
    ).subscribe();
  }

  get saveButtonLabel(): string  {
    return this.isUpdating() ? 'Updating...' : 'userProfile.saveChanges'
  }
}
