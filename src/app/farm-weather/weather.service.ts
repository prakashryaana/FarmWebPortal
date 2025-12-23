import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injector } from '@angular/core';

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
    rainyMonths: string[];
    winterMonths: string[];
    monthly: { month: string; meanTemp: number; totalRain: number; meanWind: number }[];
  };
}

export interface HistoricalWeather {
  monthly: { month: string; meanTemp: number; totalRain: number; meanWind: number }[];
  rainyMonths: string[];
  winterMonths: string[];
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiBase = 'https://api.open-meteo.com/v1';
  private http: HttpClient;

  constructor(private injector: Injector) {
    // Create HttpClient WITHOUT interceptors
    this.http = new HttpClient(this.injector.get(HttpBackend));
  }

  getWeatherData(coords: Coordinates): Observable<WeatherData> {
    const currentParams = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      current: 'temperature_2m,precipitation,wind_speed_10m',
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
    );
  }

  formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  getHistoricalWeather(coords: Coordinates, startDate: Date, endDate: Date): Observable<HistoricalWeather> {
    const historicalParams = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      start_date: this.formatDate(startDate),
      end_date: this.formatDate(endDate),
      daily: 'temperature_2m_mean,precipitation_sum,wind_speed_10m_max',
      timezone: 'Asia/Kolkata',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm'
    });
    
    //const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=Asia/Kolkata&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`;
    const url = `https://archive-api.open-meteo.com/v1/archive?${historicalParams}`;
    
    return this.http.get<any>(url).pipe(
      map(data => {
        const monthlyData: HistoricalWeather['monthly'] = [];
        const monthlyRain: number[] = Array(12).fill(0);
        const monthlyTempSum: number[] = Array(12).fill(0);
        const monthlyWindSum: number[] = Array(12).fill(0);
        const monthlyDayCount: number[] = Array(12).fill(0);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        data.daily.time.forEach((dateStr: string, i: number) => {
          const date = new Date(dateStr);
          const monthIdx = date.getMonth(); // 0=Jan, 11=Dec (adjust for Dec start)
          const adjIdx = monthIdx === 0 ? 11 : monthIdx - 1; // Dec=0, Nov=11
          
          monthlyTempSum[adjIdx] += data.daily.temperature_2m_mean[i];
          monthlyRain[adjIdx] += data.daily.precipitation_sum[i];
          monthlyWindSum[adjIdx] += data.daily.wind_speed_10m_max[i];
          monthlyDayCount[adjIdx]++;
        });
        
        // Calculate monthly averages
        for (let i = 0; i < 12; i++) {
          const days = monthlyDayCount[i] || 1;
          monthlyData.push({
            month: monthNames[i],
            meanTemp: +(monthlyTempSum[i] / days).toFixed(1),
            totalRain: +(monthlyRain[i]).toFixed(1),
            meanWind: +(monthlyWindSum[i] / days).toFixed(1)
          });
        }
        
        // India-standard seasons
        const rainyMonths = monthlyData
          .filter(m => m.totalRain > 50)
          .map(m => m.month)
          .slice(0, 6) || ['Jun', 'Jul', 'Aug', 'Sep']; // Prioritize monsoon months
        
        const winterMonths = ['Dec', 'Jan', 'Feb'];
        return { monthly: monthlyData, rainyMonths, winterMonths };
      })
    );
  }
}
