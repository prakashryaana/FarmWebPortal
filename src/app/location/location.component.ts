import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { GeolocationService, Coordinates } from './geolocation.service';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { FarmWeatherComponent } from '../farm-weather/farm-weather.component';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    LeafletMapComponent,
    FarmWeatherComponent
  ]
})
export class LocationComponent {
  location?: Coordinates;
  errorMessage?: string;
  isLoading = false;
  
  manualLatitude: string = '';
  manualLongitude: string = '';
  manualEntryError: string = '';

  constructor(private geoService: GeolocationService) {}

  getLocation(): void {
    this.isLoading = true;
    this.errorMessage = undefined;
    this.manualEntryError = '';
    this.geoService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.location = coords;
        this.isLoading = false;
        this.manualLatitude = '';
        this.manualLongitude = '';
      },
      error: (err) => {
        this.errorMessage = err;
        this.isLoading = false;
      },
    });
  }

  setManualLocation(): void {
    this.manualEntryError = '';

    if (!this.manualLatitude || !this.manualLongitude) {
      this.manualEntryError = 'Please enter both latitude and longitude values.';
      return;
    }

    const lat = parseFloat(this.manualLatitude);
    const lon = parseFloat(this.manualLongitude);

    if (isNaN(lat) || isNaN(lon)) {
      this.manualEntryError = 'Please enter valid numeric values.';
      return;
    }

    if (lat < -90 || lat > 90) {
      this.manualEntryError = 'Latitude must be between -90 and 90 degrees.';
      return;
    }

    if (lon < -180 || lon > 180) {
      this.manualEntryError = 'Longitude must be between -180 and 180 degrees.';
      return;
    }

    const coords: Coordinates = { latitude: lat, longitude: lon };
    this.geoService.setManualCoordinates(coords);
    this.location = coords;
  }
}
