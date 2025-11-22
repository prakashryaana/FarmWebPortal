import { Injectable } from '@angular/core';
    import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private baseUrl = `${environment.baseApiUrl}api`; // Replace with your backend API URL

      constructor(private http: HttpClient) { }

      upload(file: File): Observable<HttpEvent<any>> {
        const formData: FormData = new FormData();
        formData.append('file', file);

        const req = new HttpRequest('POST', `${this.baseUrl}/fileupload/upload`, formData, {
          reportProgress: true,
          responseType: 'json'
        });

        return this.http.request(req);
      }
}
