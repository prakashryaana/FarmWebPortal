    import { Component, Output, EventEmitter } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { CommonModule } from '@angular/common';
    import { environment } from '../../environments/environment';
    import { HttpEvent, HttpEventType } from '@angular/common/http';
    import { UploadService } from '../file-upload/upload.service';
    import { MatProgressBar } from '@angular/material/progress-bar';

    @Component({
      selector: 'app-file-upload',
      imports: [CommonModule, MatProgressBar],
      templateUrl: './file-upload.component.html',
      styleUrls: ['./file-upload.component.css']
    })
    export class FileUploadComponent {
      @Output() fileUploaded = new EventEmitter<any>(); // Emit upload success or data
      private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint
      selectedFile: File | null = null;
      progress = 0;
      message = 'Please select a file to upload';

      constructor(private http: HttpClient, private uploadService: UploadService) {}

      onFileSelected(event: any): void {
        this.selectedFile = event.target.files[0];
        this.progress = 0;
        this.message = '';
      }

      uploadFile(): void {
        if (!this.selectedFile) {
          this.message = 'Please select a file first!';
          return;
        }

         this.uploadService.upload(this.selectedFile).subscribe({
          next: (event: HttpEvent<any>) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.progress = Math.round(100 * event.loaded / event.total!);
            } else if (event.type === HttpEventType.Response) {
              this.message = 'Upload successful!';
              // Handle successful upload response
              this.fileUploaded.emit(event.body); // Emit response data
              this.selectedFile = null; // Reset
            }
          },
          error: (err: any) => {
            this.progress = 0;
            this.message = 'Could not upload the file: ' + err.message;
          }
        });
      }
    }