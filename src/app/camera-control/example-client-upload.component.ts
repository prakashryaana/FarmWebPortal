// Example 2: Using with client-side upload (parent handles upload)
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { CameraControlComponent, CameraControlOutput } from './camera-control.component';

@Component({
  selector: 'app-add-observation-with-camera',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CameraControlComponent
  ],
  template: `
    <form [formGroup]="observationForm" (ngSubmit)="submitObservation()">
      <!-- Observation fields -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Observation Type</mat-label>
        <input matInput formControlName="type">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description" rows="4"></textarea>
      </mat-form-field>

      <!-- Camera Control - Parent will handle upload -->
      <h3>Capture Observation Evidence</h3>
      <app-camera-control 
        [allowUpload]="false"
        (photoCapture)="onObservationPhotoCapture($event)">
      </app-camera-control>

      <!-- Submit button -->
      <button 
        mat-raised-button 
        color="primary" 
        type="submit" 
        [disabled]="!observationForm.valid || !photoBlob">
        Submit Observation with Photo
      </button>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class AddObservationWithCameraComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  photoBlob: Blob | null = null;
  photoFileName: string = '';

  observationForm: FormGroup = this.fb.group({
    type: ['', Validators.required],
    description: ['', Validators.required]
  });

  onObservationPhotoCapture(output: CameraControlOutput) {
    if (output.success && output.fileBlob) {
      this.photoBlob = output.fileBlob;
      this.photoFileName = output.filename || 'observation_photo.jpg';
      this.snackBar.open('Photo ready to submit', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Failed to capture photo', 'Close', { duration: 5000 });
    }
  }

  submitObservation() {
    if (!this.observationForm.valid || !this.photoBlob) {
      return;
    }

    const formData = new FormData();
    formData.append('type', this.observationForm.value.type || '');
    formData.append('description', this.observationForm.value.description || '');
    formData.append('photo', this.photoBlob, this.photoFileName);

    // Custom upload endpoint
    this.http.post('/api/observations', formData).subscribe({
      next: (response: any) => {
        this.snackBar.open('Observation submitted with photo!', 'Close', { duration: 5000 });
        this.observationForm.reset();
        this.photoBlob = null;
      },
      error: (error) => {
        console.error('Error submitting observation:', error);
        this.snackBar.open('Error submitting observation. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }
}
