import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserProfileService } from './user-profile.service';
import { UserProfile } from './user-profile.service';

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
    MatIconModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userProfileService = inject(UserProfileService);

  profileForm = signal<FormGroup | null>(null);
  userProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  isUpdating = signal(false);
  updateSuccess = signal(false);

  ngOnInit() {
    this.profileForm.set(this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobile: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]]
    }));

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

    this.userProfileService.updateMyProfile(formValue).pipe(
      tap(() => {
        this.userProfile.update(profile => 
          profile ? { ...profile, ...formValue } : profile
        );
        this.updateSuccess.set(true);
      }),
      catchError(error => {
        console.error('Update failed:', error);
        return of(null);
      }),
      finalize(() => this.isUpdating.set(false))
    ).subscribe();
  }
}
