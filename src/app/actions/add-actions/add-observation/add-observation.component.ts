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
import { TranslateModule } from '@ngx-translate/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CameraControlComponent, CameraControlOutput } from '../../../camera-control/camera-control.component';

export interface UploadResult {
  photoPath: string | null;
  voiceNotePath: string | null;
}

@Component({
  selector: 'app-add-observation',
  standalone: true,
  //changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, MatProgressSpinnerModule,
    MatCardModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule, TranslateModule, MatTabsModule,
    CameraControlComponent
  ],
  templateUrl: './add-observation.component.html',
  styleUrls: ['./add-observation.component.css']
})
export class AddObservationComponent implements OnDestroy {
  @ViewChild(CameraControlComponent, { static: false }) cameraControl!: CameraControlComponent;
  private readonly observationService = inject(ObservationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private uploadService = inject(UploadService);
  submitPressed: boolean = false;
  photoFileName: string = '';
  photoFile: File | null = null;

  
  readonly observationTypes = [
    { value: 'Disease', label: 'observation.disease' },
    { value: 'Insect', label: 'observation.insect' },
    { value: 'WaterAvailability', label: 'observation.waterAvailability' },
    { value: 'NutritionalDeficiency', label: 'observation.nutritionalDeficiency' },
    { value: 'CropGrowthStatus', label: 'observation.cropGrowthStatus' },
    { value: 'DripLineCheck', label: 'observation.dripLineCheck' },
    { value: 'WaterTDSPHCheck', label: 'observation.waterTDSPHCheck' },
    { value: 'GrowingMediaTDSPHCheck', label: 'observation.growingMediaTDSPHCheck' },
    { value: 'RootsCheck', label: 'observation.rootsCheck' },
    { value: 'ShadeNetCheck', label: 'observation.shadeNetCheck' },
    { value: 'StickyTrapCheck', label: 'observation.stickyTrapCheck' },
    { value: 'Others', label: 'observation.others' }
  ];

  observationForm!: FormGroup<any>;
  readonly recorder = signal<any>(null);
  readonly audioChunks = signal<Blob[]>([]);
  readonly audioUrl = signal<string | null>(null);
  readonly mediaStream = signal<MediaStream | null>(null);
  
  readonly isRecording = signal(false);
  readonly recordingTime = signal(0);
  readonly maxRecordingTime = 30;
  readonly recordingInterval = signal<any>(null);
  
  readonly serviceLoading = this.observationService.isLoading.asReadonly();
  readonly serviceError = this.observationService.lastError.asReadonly();

  readonly wasLoading = signal(false);

  readonly canSubmit = computed(() => {
    return this.observationForm.valid;
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

  constructor() {
  // Initialize IMMEDIATELY (no queueMicrotask)
  this.observationForm = this.fb.group({
    observationType: ['', Validators.required],
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
      this.snackBar.open('Observation saved successfully!', 'Close', {
        duration: 3000,
        panelClass: ['centered-success-snackbar']
      });
      this.reset();
      this.wasLoading.set(false);
    }
    this.wasLoading.set(this.serviceLoading());
  });
}

  ngOnInit() {
    this.observationTypes.sort((a, b) => a.label.localeCompare(b.label));
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

  async onSubmit(event:any): Promise<void> {
    if (!this.submitPressed) {
      return;
    }
    this.submitPressed = false;
    const form = this.observationForm;
    if (!form || form.invalid || !this.selectedCropId || this.selectedCropId === environment.tempCropId) {
      this.snackBar.open('Please fill required fields', 'Close', { duration: 3000 });
      return;
    }
    let photoPath = '';
    let voiceNotePath = '';

    try {
      if (this.photoFile) {
        photoPath = await this.uploadFile(this.photoFile);
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
      this.reset();

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

  reset(): void {
    // SAFE: Check if form exists before reset
    // const form = this.observationForm;
    // if (form) {
    //   form.reset({
    //     observationType: 'DiseaseInsectAttack'
    //   });
    // }
    this.observationForm.reset();
    this.audioUrl.set(null);
    this.recordingTime.set(0);
    this.photoFile = null;
    this.photoFileName = '';
    
    if (this.cameraControl) {
      this.cameraControl.reset();
    }

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

  onPhotoCapture(output: CameraControlOutput) {
    if (output.success && output.fileBlob) {
      this.photoFile = new File([output.fileBlob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });;
      this.photoFileName = output.filename;
      console.log('Photo captured:', this.photoFileName);
      this.snackBar.open('Photo ready to submit', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Failed to capture photo', 'Close', { duration: 5000 });
    }
  }

  onPhotoCancel() {
    this.photoFile = null;
    this.photoFileName = '';
    console.log('Photo capture cancelled');
  }

  ngOnDestroy(): void {
    const interval = this.recordingInterval();
    if (interval) clearInterval(interval);
    
    this.stopRecording();
  }
}