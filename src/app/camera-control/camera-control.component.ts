import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { UploadService } from '../file-upload/upload.service';
import { lastValueFrom } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { HttpEvent, HttpEventType } from '@angular/common/http';

export interface CameraControlOutput {
  filePath?: string;
  filename?: string;
  fileBlob?: Blob;
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-camera-control',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './camera-control.component.html',
  styleUrl: './camera-control.component.css'
})
export class CameraControlComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('galleryInput', { static: false }) galleryInput!: ElementRef<HTMLInputElement>;

  @Input() allowUpload: boolean = true;
  @Output() photoCapture = new EventEmitter<CameraControlOutput>();

  // State variables
  cameraMode = false;
  capturedPhoto: string | null = null;
  photoFileName: string | null = null;
  uploading = false;
  isLoading = false;

  // Camera variables
  private mediaStream: MediaStream | null = null;
  private cameras: MediaDeviceInfo[] = [];
  private currentCameraIndex = 0;
  private backCameraIndex = -1;

  constructor(private snackBar: MatSnackBar, private http: HttpClient, private uploadService: UploadService) {}

  ngOnInit() {
    console.log('CameraControlComponent initialized with allowUpload:', this.allowUpload);
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async openCamera() {
    try {
      this.isLoading = true;
      // Get all available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras = devices.filter(device => device.kind === 'videoinput');

      if (this.cameras.length === 0) {
        this.snackBar.open('No camera found on this device', 'Close', { duration: 5000 });
        this.isLoading = false;
        return;
      }

      console.log(`Found ${this.cameras.length} camera(s):`, this.cameras.map(c => c.label));

      // Find back/rear camera
      this.backCameraIndex = this.cameras.findIndex(cam => {
        const label = cam.label.toLowerCase();
        return label.includes('back') || label.includes('rear') || label.includes('environment');
      });

      // Default to back camera if available, otherwise use the only/first camera
      if (this.backCameraIndex !== -1) {
        this.currentCameraIndex = this.backCameraIndex;
      } else {
        this.currentCameraIndex = 0;
      }

      // Enable camera mode first to render the video element
      this.cameraMode = true;

      // Wait for the template to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify video element is available
      if (!this.videoElement) {
        console.error('Video element not available');
        this.snackBar.open('Camera initialization error', 'Close', { duration: 5000 });
        this.cameraMode = false;
        this.isLoading = false;
        return;
      }

      await this.startCameraStream();
      console.log('Camera opened successfully');
      this.isLoading = false;
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.snackBar.open('Unable to access camera. Please check permissions.', 'Close', { duration: 5000 });
      this.cameraMode = false;
      this.isLoading = false;
    }
  }

  private async startCameraStream() {
    try {
      // Stop previous stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }

      const camera = this.cameras[this.currentCameraIndex];
      const isBackCamera = this.currentCameraIndex === this.backCameraIndex ||
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear');

      console.log('Starting camera stream for camera:', camera.label, 'deviceId:', camera.deviceId);

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: camera.deviceId ? { exact: camera.deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: isBackCamera ? 'environment' : 'user'
        }
      });

      // Check if mediaStream has video tracks
      const videoTracks = this.mediaStream.getVideoTracks();
      console.log('MediaStream video tracks:', videoTracks.length);

      if (!videoTracks || videoTracks.length === 0) {
        throw new Error('No video tracks in MediaStream');
      }

      if (this.videoElement) {
        const video = this.videoElement.nativeElement;

        // Set the mediaStream
        video.srcObject = this.mediaStream;
        console.log('Video element srcObject set');

        // Try to play immediately
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            console.warn('Initial play() failed:', err);
            // Try again on loadedmetadata
            video.onloadedmetadata = () => {
              console.log('onloadedmetadata fired');
              video.play().catch((err2: any) => console.error('Error playing video on loadedmetadata:', err2));
            };
          });
        }

        // Fallback: ensure video plays after a short delay
        setTimeout(() => {
          if (video.paused && this.mediaStream) {
            console.log('Video still paused, attempting play via setTimeout');
            video.play().catch((err: any) => console.error('Error in setTimeout play:', err));
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error starting camera stream:', error);
      this.snackBar.open('Unable to access camera. Please check permissions.', 'Close', { duration: 5000 });
      this.stopCamera();
    }
  }

  switchCamera() {
    if (this.cameras.length > 1) {
      this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
      this.startCameraStream();
    }
  }

  async capturePhoto() {
    if (this.videoElement && this.canvasElement) {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.95);
        this.photoFileName = `photo_${Date.now()}.jpg`;
        this.stopCamera();
        this.snackBar.open('Photo captured!', 'Close', { duration: 3000 });
        await this.uploadPhoto();
      } else {
        this.snackBar.open('Camera not ready. Please try again.', 'Close', { duration: 3000 });
        console.warn('Video dimensions:', { width: video.videoWidth, height: video.videoHeight });
      }
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraMode = false;
  }

  pickFromGallery() {
    this.galleryInput.nativeElement.click();
  }

  onPhotoCapture(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.photoFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.capturedPhoto = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  retakePhoto() {
    this.capturedPhoto = null;
    this.photoFileName = null;
    if (this.galleryInput) this.galleryInput.nativeElement.value = '';
  }

  async uploadPhoto() {
    if (!this.capturedPhoto) {
      return;
    }

    this.uploading = true;

    try {
      if (this.allowUpload) {
        // Upload to server
        const blob = await this.dataUrlToBlob(this.capturedPhoto);
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const filePath = await this.uploadFile(file);

        // const formData = new FormData();
        // formData.append('file', blob, this.photoFileName);

        // // Replace with your actual upload endpoint
        // const uploadUrl = '/api/upload'; // Update this with your actual endpoint
        // const response: any = await this.http.post(uploadUrl, formData).toPromise();

        // this.snackBar.open('Photo uploaded successfully!', 'Close', { duration: 5000 });
        const output: CameraControlOutput = {
          success: true,
          message: 'Photo uploaded successfully',
          filePath: filePath
        };
        this.photoCapture.emit(output);
      } else {
        // Return blob to parent
        const blob = await this.dataUrlToBlob(this.capturedPhoto);
        this.snackBar.open('Photo ready for upload', 'Close', { duration: 3000 });
        const output: CameraControlOutput = {
          success: true,
          message: 'Photo captured',
          filename: this.photoFileName,
          fileBlob: blob
        };
        this.photoCapture.emit(output);
      }

      // Reset after successful operation
      //this.retakePhoto();
    } catch (error) {
      console.error('Error uploading photo:', error);
      this.snackBar.open('Error uploading photo. Please try again.', 'Close', { duration: 5000 });
      const output: CameraControlOutput = {
        success: false,
        message: 'Error uploading photo'
      };
      this.photoCapture.emit(output);
    } finally {
      this.uploading = false;
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

  private dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve) => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      resolve(new Blob([u8arr], { type: mime }));
    });
  }

  get hasManyCamera(): boolean {
    return this.cameras.length > 1;
  }

  onVideoError(error: Event) {
    console.error('Video error:', error);
    this.snackBar.open('Camera error occurred', 'Close', { duration: 5000 });
    this.stopCamera();
  }

  reset() {
    this.stopCamera();
    this.capturedPhoto = null;
    this.photoFileName = null;
    this.cameraMode = false;
    this.uploading = false;
    this.isLoading = false;
    if (this.galleryInput) {
      this.galleryInput.nativeElement.value = '';
    }
  }
}
