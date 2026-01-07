import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private apiUrl = `${environment.baseApiUrl}api/Address`; // Update with your actual API endpoint

  constructor(private http: HttpClient) {}

  getByPincode(pincode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetByPincode/${pincode}`);
  }

  getStateByPincode(pincode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetStateByPincode/${pincode}`);
  }

  getAllStates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetAllStates`);
  }

  getDistrictsByState(state: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetDistrictsByState/${state}`);
  }

  GetSubdistrictsByDistrict(districtCode: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetSubdistrictsByDistrict/${districtCode}`);
  }

  GetVillagesBySubDistrict(subDistrictName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetVillagesBySubDistrict/${subDistrictName}`);
  }

  getKarnatakaDistricts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetKarnatakaDistricts`);
  }

  GetKarnatakaTalukasByDistrict(districtCode: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetKarnatakaTalukasByDistrict/${districtCode}`);
  }

  GeKarnatakatHoblisByDistrictAndTaluka(districtCode: number, talukaCode: number): Observable<any> {
    const params = new HttpParams().set('districtCode', encodeURIComponent(districtCode)).set('talukaCode', encodeURIComponent(talukaCode));
    return this.http.get(`${this.apiUrl}/GeKarnatakatHoblisByDistrictAndTaluka/`, {params});
  }

  GetKarnatakaVillagesByDistrictAndTalukaAndHobli(districtCode: number, talukaCode: number, hobliCode: number): Observable<any> {
    const params = new HttpParams().set('districtCode', encodeURIComponent(districtCode)).set('talukaCode', encodeURIComponent(talukaCode)).set('hobliCode', encodeURIComponent(hobliCode));
    return this.http.get(`${this.apiUrl}/GetKarnatakaVillagesByDistrictAndTalukaAndHobli/`, {params});
  }
}
