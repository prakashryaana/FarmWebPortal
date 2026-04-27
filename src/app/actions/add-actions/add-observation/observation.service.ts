import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

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
  private apiUrl = `${environment.baseApiUrl}api/observation`;

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  createObservation(request: ObservationRequest): any {
    this.isLoading.set(true);
    this.lastError.set(null);
    console.log(request);
    // const formData = new FormData();
    // formData.append('observationType', request.observationType);
    // formData.append('message', request.message || '');
    // formData.append('cropId', request.cropId);
    // formData.append('voiceNote', request.voiceNote);
    // formData.append('photo', request.photo);
    
    this.http.post<any>(`${this.apiUrl}/AddObservation`, request)
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

    getByCrop(cropId: string) {
      return this.http.get<Observation[]>(`${this.apiUrl}/cropId/${cropId}`);
    }
}

export interface ObservationRequest {
  observationType: string;
  message?: string;
  cropId: string;
  voiceNote?: string;
  photo?: string;
}

export interface Observation {
  id?: string;
  observationId?: string;
  cropId: string;
  observationType: string;
  createdAt: string;
  updatedAt?: string;
  message?: string;
  imageUrl?: string | null;
  voiceNoteUrl?: string | null;
}
