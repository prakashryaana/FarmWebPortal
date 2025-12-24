import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';

export interface ObservationResponse {
  readonly success: boolean;
  readonly id?: string;
  readonly message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ObservationService {
  readonly isLoading = signal(false);
  readonly lastError = signal<string | null>(null);
  private apiUrl = `${environment.baseApiUrl}api/observations`;

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  createObservation(formData: FormData): void {
    this.isLoading.set(true);
    this.lastError.set(null);

    this.http.post<ObservationResponse>(this.apiUrl, formData)
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          console.log('Observation saved:', response);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.lastError.set(error.error?.message || 'Save failed');
          console.error('API Error:', error);
        }
      });
  }
}
