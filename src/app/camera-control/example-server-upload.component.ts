// Example 1: Using with server upload (in add-activity component)
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CameraControlComponent, CameraControlOutput } from './camera-control.component';

@Component({
  selector: 'app-add-activity-with-camera',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CameraControlComponent
  ],
  template: `
    <form [formGroup]="activityForm" (ngSubmit)="submitActivity()">
      <!-- Activity fields -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Activity Type</mat-label>
        <input matInput formControlName="type">
      </mat-form-field>

      <!-- Camera Control with Server Upload -->
      <h3>Capture Activity Photo</h3>
      <app-camera-control 
        [allowUpload]="true"
        (photoCapture)="onActivityPhotoCapture($event)">
      </app-camera-control>

      <!-- Submit button -->
      <button mat-raised-button color="primary" type="submit" [disabled]="!activityForm.valid || !activityPhotoPath">
        Submit Activity
      </button>
    </form>
  `
})
export class AddActivityWithCameraComponent {
  private fb = inject(FormBuilder);
  activityPhotoPath: string = '';

  activityForm: FormGroup = this.fb.group({
    type: ['', Validators.required]
  });

  onActivityPhotoCapture(output: CameraControlOutput) {
    if (output.success && output.filePath) {
      this.activityPhotoPath = output.filePath;
      console.log('Activity photo uploaded:', output.filePath);
    } else {
      console.error('Failed to capture activity photo:', output.message);
    }
  }

  submitActivity() {
    if (this.activityForm.valid && this.activityPhotoPath) {
      // Submit form with photo path
      console.log('Submitting activity with photo:', this.activityPhotoPath);
    }
  }
}
