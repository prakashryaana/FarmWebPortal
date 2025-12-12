import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  current: {
    temperature: number;
    wind_speed: number;
    precipitation: number;
  };
  historical: {
    monthlyMeanTemp: number[]; // Jan to Dec
    totalRainfall: number[];   // Jan to Dec
    rainyMonths: string[];
    winterMonths: string[];
    avgWindSpeed: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiBase = 'https://api.open-meteo.com/v1';

  constructor(private http: HttpClient) {}

  getWeatherData(coords: Coordinates): Observable<WeatherData> {
    const currentParams = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      current: 'temperature_2m,precipitation,wind_speed_10m',
      timezone: 'auto'
    });

    const historicalParams = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      monthly: 'temperature_2m,precipitation_sum,wind_speed_10m_max',
      timezone: 'auto'
    });

    return this.http.get<any>(`${this.apiBase}/forecast?${currentParams}`).pipe(
      map(currentRes => ({
        current: {
          temperature: currentRes.current.temperature_2m,
          wind_speed: currentRes.current.wind_speed_10m,
          precipitation: currentRes.current.precipitation
        },
        historical: null as any
      })),
      // Note: For full implementation, combine with historical call using forkJoin
      // This simplified version focuses on structure and current data
    );
  }

  analyzeHistorical(data: any): any {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const meanTemp = data.monthly.temperature_2m;
    const rainfall = data.monthly.precipitation_sum;
    const windSpeed = data.monthly.wind_speed_10m_max;

    const rainyMonths = months.filter((_, i) => rainfall[i] > 50); // >50mm
    const winterMonths = months.slice(0, 3).concat(months.slice(10, 12)); // Dec-Feb

    return {
      monthlyMeanTemp: meanTemp,
      totalRainfall: rainfall,
      rainyMonths,
      winterMonths,
      avgWindSpeed: windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length
    };
  }
}
