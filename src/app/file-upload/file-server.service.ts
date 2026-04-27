import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileServerService {
  private apiUrl = `${environment.baseApiUrl}api`;

  /**
   * Converts a local file path to a downloadable URL
   * Assumes the backend has a /fileupload/download endpoint
   * @param localFilePath The local file path (e.g., C:\EasyGrowFiles\Images\filename.jpg)
   * @returns The URL to download the file via the API
   */
  getImageUrl(localFilePath: string | null): string | null {
    if (!localFilePath || localFilePath.trim() === '') {
      return null;
    }

    // Extract just the filename from the full path
    // e.g., "C:\EasyGrowFiles\Images\filename.jpg" -> "filename.jpg"
    const filename = localFilePath.split(/[\\\/]/).pop();
    
    if (!filename) {
      return null;
    }

    // Construct the API URL for downloading the file
    return `${this.apiUrl}/fileupload/download/${filename}`;
  }
}
