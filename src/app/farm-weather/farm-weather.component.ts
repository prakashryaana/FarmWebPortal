import { Component, Input, signal } from '@angular/core';
import { GeolocationService, Coordinates } from '../location/geolocation.service';
import { WeatherService, WeatherData, HistoricalWeather } from './weather.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-farm-weather',
  templateUrl: './farm-weather.component.html',
  standalone: true,
  imports: [MatCardModule, MatTableModule]
})
export class FarmWeatherComponent {
  @Input() latitude = 0;
  @Input() longitude = 0;
  location?: Coordinates;
  weatherData?: WeatherData;
  isLoading = false;
  errorMessage?: string;
  startDate:Date;
  endDate:Date;
  formattedStartDate:string;
  formattedEndDate:string;
  displayedColumns = ['month', 'temp', 'rain', 'wind'];

  //private historicalWeatherData = signal<HistoricalWeather | null>(null);

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
      // Calculate dates: past N months from today
      const monthsBack: number = 12;
      this.endDate = new Date(); // Today
      this.endDate.setDate(this.endDate.getDate() - 1); // Yesterday for complete data
      
      this.startDate = new Date(this.endDate);
      this.startDate.setMonth(this.startDate.getMonth() - monthsBack + 1); // Past 12 months

      this.formattedStartDate = this.weatherService.formatDate(this.startDate);
      this.formattedEndDate = this.weatherService.formatDate(this.endDate);

      await this.weatherService.getHistoricalWeather(this.location, this.startDate, this.endDate).subscribe({
        next:data => {
          this.weatherData.historical = data;
          //this.historicalWeatherData.set(data);
        },
        error:err => {
          console.error(err?.message);
        }
      });
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.isLoading = false;
    }
  }
}
