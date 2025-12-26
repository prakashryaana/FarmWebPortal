import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiseaseControlInventory {
  id?: string;
  diseaseControlName: string;
  quantitySupplied: number;
  suppliedDate?: string;
  quantityUsed: number;
  usedDate?: string;
}

@Injectable({ providedIn: 'root' })
export class DiseaseControlInventoryService {
  private api = `${environment.baseApiUrl}api/disease-control-inventory`;

  constructor(private http: HttpClient) {}

  private toUtcIso(d?: Date | null) {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())).toISOString();
  }

  create(item: Partial<DiseaseControlInventory> & { suppliedDate?: Date | string, usedDate?: Date | string }): Observable<any> {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    if ((item.usedDate as any) instanceof Date) payload.usedDate = this.toUtcIso(item.usedDate as Date);
    return this.http.post(this.api, payload);
  }

  list(): Observable<DiseaseControlInventory[]> { return this.http.get<DiseaseControlInventory[]>(this.api); }
  get(id: string): Observable<DiseaseControlInventory> { return this.http.get<DiseaseControlInventory>(`${this.api}/${id}`); }
  update(id: string, item: Partial<DiseaseControlInventory> & { suppliedDate?: Date | string, usedDate?: Date | string }) {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    if ((item.usedDate as any) instanceof Date) payload.usedDate = this.toUtcIso(item.usedDate as Date);
    return this.http.put(`${this.api}/${id}`, payload);
  }
  delete(id: string) { return this.http.delete(`${this.api}/${id}`); }
}