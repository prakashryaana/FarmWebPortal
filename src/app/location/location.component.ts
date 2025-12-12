import { Component } from '@angular/core';
import { GeolocationService, Coordinates } from './geolocation.service';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { FarmWeatherComponent } from '../farm-weather/farm-weather.component';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  imports: [LeafletMapComponent, FarmWeatherComponent]
})
export class LocationComponent {
  location?: Coordinates;
  errorMessage?: string;
  isLoading = false;

  constructor(private geoService: GeolocationService) {}

  getLocation(): void {
    this.isLoading = true;
    this.errorMessage = undefined;
    this.geoService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.location = coords;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err;
        this.isLoading = false;
      },
    });
  }
}
