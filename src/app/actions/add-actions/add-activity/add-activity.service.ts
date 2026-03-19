import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AddActivityService {
  private apiUrl = `${environment.baseApiUrl}api`;
  constructor(private http: HttpClient) { }

  addActivity(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activity`, data);
  }
}

export interface Activity {
  activityType: string; // for spraying
  message?: string;
  activityId: string;
  cropId: string;
  photo?: string;
}