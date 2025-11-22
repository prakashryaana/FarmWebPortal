    import { Component, Output, EventEmitter } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { CommonModule } from '@angular/common';
    import { environment } from '../../environments/environment';
    import { HttpEvent, HttpEventType } from '@angular/common/http';
    import { UploadService } from '../file-upload/upload.service';

    @Component({
      selector: 'app-file-upload',
      imports: [CommonModule],
      templateUrl: './file-upload.component.html',
      styleUrls: ['./file-upload.component.css']
    })
    export class FileUploadComponent {
      @Output() fileUploaded = new EventEmitter<any>(); // Emit upload success or data
      private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint
      selectedFile: File | null = null;
      progress = 0;
      message = '';

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

        //upload logic working - start
        // const formData = new FormData();
        // formData.append('file', this.selectedFile, this.selectedFile.name);

        // this.http.post(`${this.apiUrl}/fileupload/upload`, formData, {
        //   reportProgress: true,
        //   observe: 'events'
        // }).subscribe(event => {
        //   // Handle upload events (progress, success, error)
        //   // ... update uploadProgress ...
        //   if (event.type === 4) { // HttpEventType.Response
        //     this.fileUploaded.emit(event.body); // Emit response data
        //     this.selectedFile = null; // Reset
        //   }
        // });
        //upload logic working - end
      }
    }

// import { Component } from '@angular/core';
// import { Input } from '@angular/core';
// import { HttpClient, HttpEventType } from '@angular/common/http';
// import { Subscription } from 'rxjs';
// import { finalize } from 'rxjs/operators';
// import {MatIconModule} from '@angular/material/icon';
// import {MatProgressBarModule} from '@angular/material/progress-bar';

// @Component({
//   selector: 'app-file-upload',
//   imports: [MatIconModule, MatProgressBarModule],
//   templateUrl: './file-upload.component.html',
//   styleUrl: './file-upload.component.css',
// })
// export class FileUploadComponent {

//     @Input()
//     requiredFileType:string;

//     fileName = '';
//     uploadProgress:number;
//     uploadSub: Subscription;

//     constructor(private http: HttpClient) {}

//     onFileSelected(event: any) {
//         const file:File = event.target.files[0];
      
//         if (file) {
//             this.fileName = file.name;
//             const formData = new FormData();
//             formData.append("thumbnail", file);

//             const upload$ = this.http.post("/api/thumbnail-upload", formData, {
//                 reportProgress: true,
//                 observe: 'events'
//             })
//             .pipe(
//                 finalize(() => this.reset())
//             );
          
//             this.uploadSub = upload$.subscribe(event => {
//               if (event.type == HttpEventType.UploadProgress) {
//                 this.uploadProgress = Math.round(100 * (event.loaded / event.total));
//               }
//             })
//         }
//     }

//   cancelUpload() {
//     this.uploadSub.unsubscribe();
//     this.reset();
//   }

//   reset() {
//     this.uploadProgress = null;
//     this.uploadSub = null;
//   }
// }