import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private farmCoordinates = signal<Coordinates | null>(null);

  readonly coordinates = this.farmCoordinates.asReadonly();
  readonly hasLocationData = computed(() => this.coordinates() !== null);

  getCurrentPosition(): Observable<Coordinates> {
    return new Observable<Coordinates>((observer) => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          observer.complete();
        },
        (error) => {
          observer.error(`Geolocation error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    }).pipe(
      tap(coords => {
        this.farmCoordinates.set(coords);
      })
    );
  }

  setManualCoordinates(coords: Coordinates): void {
    this.farmCoordinates.set(coords);
    console.log('Manual coordinates set:', this.farmCoordinates());
  }
}
