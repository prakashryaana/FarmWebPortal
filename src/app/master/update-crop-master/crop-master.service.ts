import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CropMaster {
  cropId?: string;
  cropName: string;
  duration: number;
  expectedYield: number;
  sowingTime: string;
  harvestTime: string;
  sowingMethod: 'Rizomes' | 'Seedlings' | string;
  moleculesToAdd?: string;
  pestsAndDiseases?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CropMasterService {
  private api = `${environment.baseApiUrl}api/cropmaster`;

  constructor(private http: HttpClient) {}

  create(item: CropMaster): Observable<any> {
    return this.http.post(`${this.api}/AddCropMaster`, item);
  }

  list(): Observable<CropMaster[]> {
    return this.http.get<CropMaster[]>(`${this.api}/GetAll`);
  }

  get(cropId: string): Observable<CropMaster> {
    return this.http.get<CropMaster>(`${this.api}/GetCropMasterByCropId/${cropId}`);
  }

  update(cropId: string, item: CropMaster): Observable<any> {
    return this.http.put(`${this.api}/UpdateCropMaster/${cropId}`, item);
  }

  delete(cropId: string): Observable<any> {
    return this.http.delete(`${this.api}/${cropId}`);
  }
}
