// farm.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CreateFarmDto, UpdateFarmDto } from '../farm-registration/farm';

export interface FarmPartial {
  farmId: string;
  farmName: string;
}

export interface FarmApiModel {
  Id: string;
  FarmName: string;
  FarmId: string;
  SurveyNumber: string;
  Address: string;
  ShadeNetArea: number;
  GeoTag: string;
  WeatherData: string;
  FarmPondVolume: number;
  IsSolarPowerAvailable: boolean;
  MotorCapacity: string;
  AdditionalWaterSource: string;
  WaterTestCertificateUrl: string;
  IsSinglePhasePower: boolean;
  IsThreePhasePower: boolean;
  GridPowerUnAvailability: string;
  AutomationRoomSize: number;
  FarmhouseNote: string;
  StorageAreaNote: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  private apiUrl = `${environment.baseApiUrl}api`; // Update with your actual API endpoint

  constructor(private http: HttpClient) { }

  getPartialFarmByIdOrName(searchTerm: string): Observable<FarmPartial[]> {
    // Build query params properly
    const params = new HttpParams().set('searchTerm', encodeURIComponent(searchTerm.trim()));

    return this.http.get<FarmPartial[]>(`${this.apiUrl}/farm/search/`,{params});
    // .pipe(
    //   map((data: FarmApiModel) => ({
    //       // Handle multiple results if necessary
    //       farmId: data[0].FarmId,
    //       farmName: data[0].FarmName
    //   }))
    // );
  }

  getFarmById(farmId: string): Observable<UpdateFarmDto> {
    return this.http.get<UpdateFarmDto>(`${this.apiUrl}/farm/${encodeURIComponent(farmId.trim())}`);
  }

  updateFarm(farmId: string, data: UpdateFarmDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/farm/${farmId}`, data);
  }

  lookupFarm(identifier: string): Observable<FarmPartial | null> {
    // Replace with your actual API endpoint
    return this.http.get<FarmPartial[]>(`${this.apiUrl}/farm/${encodeURIComponent(identifier)}`)
      .pipe(
        map(farms => farms.length > 0 ? farms[0] : null)
      );

    // For demo/testing - mock response
    // return of(this.mockLookup(identifier));
  }

  private mockLookup(identifier: string): FarmPartial | null {
    const mockFarms: FarmPartial[] = [
      { farmId: 'FARM-001', farmName: 'Green Acres Farm' },
      { farmId: 'FARM-002', farmName: 'Sunny Valley Farm' }
    ];

    return mockFarms.find(f =>
      f.farmId.toLowerCase().includes(identifier.toLowerCase()) ||
      f.farmName.toLowerCase().includes(identifier.toLowerCase())
    ) || null;
  }
}
