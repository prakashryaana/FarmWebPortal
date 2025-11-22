import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FarmRegistrationService {
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint

  constructor(private http: HttpClient) {}

  registerFarm(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/farm`, data);
  }

  getFarm(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateFarm(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteFarm(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
