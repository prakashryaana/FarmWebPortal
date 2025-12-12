import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Crop } from './crop';

@Injectable({
  providedIn: 'root',
})
export class CropRegistrationService {
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint

  constructor(private http: HttpClient) {}

  registerCrop(data: Crop): Observable<any> {
    return this.http.post(`${this.apiUrl}/crop`, data);
  }

  getCrop(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateCrop(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteCrop(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
