import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Maintainer } from './maintainer';

@Injectable({
  providedIn: 'root',
})
export class MaintainerRegistrationService {
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint

  constructor(private http: HttpClient) {}

  registerMaintainer(data: Maintainer): Observable<any> {
    return this.http.post(`${this.apiUrl}/maintainer`, data);
  }

  getMaintainer(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateMaintainer(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteMaintainer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
