import { Component, signal, computed, effect, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ObservationService } from './observation.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { CropFarmSelectorService } from '../../../crop-farm-selector/crop-farm-selector.service';
import { ObservationRequest } from './observation.service';
import { UploadService } from '../../../file-upload/upload.service';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface UploadResult {
  photoPath: string | null;
  voiceNotePath: string | null;
}

@Component({
  selector: 'app-add-observation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, MatProgressSpinnerModule,
    MatCardModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule
  ],
  templateUrl: './add-observation.component.html',
  styleUrls: ['./add-observation.component.css']
})
export class AddObservationComponent implements OnDestroy {
  private readonly observationService = inject(ObservationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private uploadService = inject(UploadService);

  
  readonly observationTypes = [
    { value: 'DiseaseInsectAttack', label: 'Disease Insect Attack' },
    { value: 'WaterAvailability', label: 'Water Availability' },
    { value: 'NutritionalDeficiency', label: 'Nutritional Deficiency' },
    { value: 'CropGrowthStatus', label: 'Crop Growth Status' },
    { value: 'Others', label: 'Others' }
  ] as const;

  observationForm!: FormGroup<any>;
  readonly recorder = signal<any>(null);
  readonly audioChunks = signal<Blob[]>([]);
  readonly audioUrl = signal<string | null>(null);
  readonly mediaStream = signal<MediaStream | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly imageFile = signal<File | null>(null);
  
  readonly isRecording = signal(false);
  readonly recordingTime = signal(0);
  readonly maxRecordingTime = 30;
  readonly recordingInterval = signal<any>(null);
  
  readonly serviceLoading = this.observationService.isLoading.asReadonly();
  readonly serviceError = this.observationService.lastError.asReadonly();

  readonly wasLoading = signal(false);

  readonly canSubmit = computed(() => {
  return this.observationForm.valid && 
         !this.isRecording() && 
         !this.serviceLoading() &&
         (!this.imageFile() || this.imageFile()!.size <= 1024 * 1024);
});

  readonly progressPercent = computed(() => 
    Math.min((this.recordingTime() / this.maxRecordingTime) * 100, 100)
  );

  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  get selectedCropName(){ return this.cropFarmSelector.selectedCropName(); }
  get selectedCropId()  { return this.cropFarmSelector.selectedCropId(); }

  // @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  // @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

  readonly isUploading = computed(() => this.serviceLoading() || this.recordingTime() > 0);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  readonly showCameraPreview = signal(false);
  readonly videoStream = signal<MediaStream | null>(null);

  constructor() {
  // Initialize IMMEDIATELY (no queueMicrotask)
  this.observationForm = this.fb.group({
    observationType: ['DiseaseInsectAttack', Validators.required],
    message: ['']
  });

  // Error handling effect (unchanged)
  effect(() => {
    const error = this.serviceError();
    if (error) {
      this.snackBar.open(error, 'Close', { duration: 5000 });
    }
  });

  // Success handling (reference form directly)
  effect(() => {
    if (!this.serviceLoading() && this.wasLoading()) {
      this.snackBar.open('Observation saved successfully!', 'Close', { duration: 3000 });
      this.resetForm();
      this.wasLoading.set(false);
    }
    this.wasLoading.set(this.serviceLoading());
  });
}

  async startRecording(): Promise<void> {
    if (this.isRecording()) return;  // ADD GUARD
    try {
      this.isRecording.set(true);
      this.recordingTime.set(0);
      this.audioChunks.set([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream.set(stream);
      
      const recorder = new MediaRecorder(stream);
      this.recorder.set(recorder);

      recorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          this.audioChunks.update(chunks => [...chunks, event.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(this.audioChunks(), { type: 'audio/webm' });
        this.audioUrl.set(URL.createObjectURL(blob));
        this.isRecording.set(false);
        const interval = this.recordingInterval();
        if (interval) clearInterval(interval);
      };

      recorder.start(250);
      
      const interval = setInterval(() => {
        this.recordingTime.update(time => time + 1);
        if (this.recordingTime() >= this.maxRecordingTime) {
          this.stopRecording();
          this.snackBar.open('Recording stopped: 30s limit reached', 'Close', { duration: 3000 });
        }
      }, 1000);
      
      this.recordingInterval.set(interval);
      
    } catch (error) {
      console.error('Recording failed', error);
      this.snackBar.open('Microphone access denied', 'Close', { duration: 4000 });
      this.isRecording.set(false);
    }
  }

  stopRecording(): void {
    const recorder = this.recorder();
    if (recorder?.state === 'recording') {
      recorder.stop();
    }
    
    const stream = this.mediaStream();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.mediaStream.set(null);
    }
  }

  playRecording(): void {
    const url = this.audioUrl();
    if (url) {
      new Audio(url).play().catch(console.error);
    }
  }


  async startCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      this.videoStream.set(stream);
      this.videoElement.nativeElement.srcObject = stream;
      this.showCameraPreview.set(true);
    } catch (err) {
      this.snackBar.open('❌ Camera access denied', 'Close');
      console.error('Camera error:', err);
    }
  }

  stopCamera(): void {
    const stream = this.videoStream();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.videoStream.set(null);
    }
    this.showCameraPreview.set(false);
  }

  async capturePhoto(): Promise<void> {
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    // ✅ Convert to JPEG (compress to <1MB)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // ✅ Your existing validation
        if (file.size > 1024 * 1024) {
          this.snackBar.open('❌ Photo too large (compressing...)', 'Close');
          return;
        }
        
        this.imageFile.set(file);
        const reader = new FileReader();
        reader.onload = () => this.imagePreview.set(reader.result as string);
        reader.readAsDataURL(file);
        
        this.stopCamera();
      }
    }, 'image/jpeg', 0.8); // 80% quality
  }

  openGallery(): void {
    // ✅ Programmatically trigger file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
  }

  handleImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.snackBar.open('Only JPEG/PNG allowed', 'Close', { duration: 3000 });
      return;
    }

    if (file.size > 1024 * 1024) {
      this.snackBar.open('Photo must be under 1MB', 'Close', { duration: 3000 });
      return;
    }

    this.imageFile.set(file);
    
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);

    //Clear BOTH inputs for re-selection
    // this.fileInput.nativeElement.value = '';
    // this.cameraInput.nativeElement.value = '';
  }

  clearPhoto(): void {
    //Clear signals
    this.imageFile.set(null);
    this.imagePreview.set(null);
    
    //Cleanup URL if exists
    if (this.imagePreview()) {
      URL.revokeObjectURL(this.imagePreview()!);
    }
    
    //Show snackbar feedback
    this.snackBar.open('🗑️ Photo cleared', 'Close', { duration: 2000 });
  }


  async onSubmit(): Promise<void> {
    const form = this.observationForm;
    if (!form || form.invalid || !this.selectedCropId || this.selectedCropId === environment.tempCropId) {
      this.snackBar.open('Please fill required fields', 'Close', { duration: 3000 });
      return;
    }
    let photoPath = '';
    let voiceNotePath = '';

    const imageFile = this.imageFile();
    try {
      if (imageFile) {
        photoPath = await this.uploadFile(imageFile);
      }

      const audioUrl = this.audioUrl();
      if (audioUrl) {
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        const audioFile = new File([blob], `obs_${Date.now()}.webm`, { type: 'audio/webm' });
        voiceNotePath = await this.uploadFile(audioFile);
      }

      const request: ObservationRequest = {
        observationType: form.value.observationType,
        message: form.value.message,
        cropId: this.selectedCropId,
        voiceNote: voiceNotePath,
        photo: photoPath
      };

      // Create observation after uploads complete
      this.observationService.createObservation(request);

    } catch (err: any) {
      console.error('Submission failed', err);
      this.snackBar.open('Save failed: ' + (err?.message || 'Unknown'), 'Close', { duration: 4000 });
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const body = await lastValueFrom(
        this.uploadService.upload(file).pipe(
          filter((e: HttpEvent<any>) => e.type === HttpEventType.Response),
          map((e: any) => e.body)
        )
      );
      return body?.fullPath || '';
    } catch (err) {
      console.error('Upload failed', err);
      throw err;
    }
  }

  resetForm(): void {
    // SAFE: Check if form exists before reset
    const form = this.observationForm;
    if (form) {
      form.reset({
        observationType: 'DiseaseInsectAttack'
      });
    }
    
    this.imagePreview.set(null);
    this.imageFile.set(null);
    this.audioUrl.set(null);
    this.recordingTime.set(0);
    
    const stream = this.mediaStream();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.mediaStream.set(null);
    }
  }

  //EMPTY PLACEHOLDER FILES - Always valid File objects
  readonly emptyPhotoFile = new File([''], 'noPhoto.jpg', { 
    type: 'image/jpeg',
    lastModified: Date.now()
  });

  //EMPTY PLACEHOLDER FILES - Always valid File objects
  readonly emptyVoiceFile = new File([''], 'noAudio.webm', { 
    type: 'audio/webm', 
    lastModified: Date.now()
  });

  ngOnDestroy(): void {
    const interval = this.recordingInterval();
    if (interval) clearInterval(interval);
    
    this.stopRecording();
    this.stopCamera();
  }
}