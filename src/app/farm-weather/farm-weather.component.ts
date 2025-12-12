import { Component, Input } from '@angular/core';
import { GeolocationService, Coordinates } from '../location/geolocation.service';
import { WeatherService, WeatherData } from './weather.service';

@Component({
  selector: 'app-farm-weather',
  templateUrl: './farm-weather.component.html',
  standalone: true
})
export class FarmWeatherComponent {
  @Input() latitude = 0;
  @Input() longitude = 0;
  location?: Coordinates;
  weatherData?: WeatherData;
  isLoading = false;
  errorMessage?: string;

  constructor(
    private geoService: GeolocationService,
    private weatherService: WeatherService
  ) {}

  async getFarmWeather(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = undefined;

    try {
      // Get location first
      //this.location = await this.geoService.getCurrentPosition().toPromise();
      this.location = { latitude: this.latitude, longitude: this.longitude };
      // Get weather data
      this.weatherData = await this.weatherService.getWeatherData(this.location!).toPromise();
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.isLoading = false;
    }
  }
}
