// services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, startWith, interval } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SummaryDto {
  totalFarms: number;
  totalCrops: number;
  distinctStates: string[];
  // you can add more fields later
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint

  getSummary(): Observable<SummaryDto> {
    // backend should compute:
    // - total farms
    // - total crops
    // - distinct states parsed from free-text farmAddress
    return this.http.get<SummaryDto>(`${this.apiUrl}/dashboard/summary`);
  }

  getTodayLiveActivitiesCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/Dashboard/Activity/Today/Count`);
  }

  pollTodayLiveActivitiesCount(seconds = 10): Observable<number> {
    return interval(seconds * 1000).pipe(
      startWith(0),
      switchMap(() => this.getTodayLiveActivitiesCount())
    );
  }
}
