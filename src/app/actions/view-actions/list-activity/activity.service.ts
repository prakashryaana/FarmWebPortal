// services/activity.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint
  private http = inject(HttpClient);
  //private apiUrl = 'https://your-api-url/api/activities';

  getByCrop(cropId: string): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activity/cropId/${cropId}`);
  }
}

// export interface Activity {
//   id: string;
//   cropId: string;
//   type: 'watering' | 'spraying' | 'fertilizing' | 'weeding' | 'other';
//   dateTime: string;        // ISO string from backend
//   message: string;
//   details?: string;
// }

export interface Activity {
  id: string;
  activityId: string;
  cropId: string;
  activityType: string;
  productName: string | null;
  quantity: string | number | null;
  message: string;
  imageUrl: string | null;
  createdAt: string;        // ISO string from backend
  updatedAt: string;        // ISO string from backend
}