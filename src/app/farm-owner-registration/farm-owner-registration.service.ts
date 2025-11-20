import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FarmOwner } from './farm-owner';

@Injectable({
  providedIn: 'root',
})
export class FarmOwnerRegistrationService {
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint

  constructor(private http: HttpClient) {}

  registerFarmOwner(data: FarmOwner): Observable<any> {
    return this.http.post(`${this.apiUrl}/Owner`, data);
  }

  getFarmOwner(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateFarmOwner(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
}
