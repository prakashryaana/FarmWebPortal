import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiseaseControlInventoryItem {
  diseaseControlName: string;
  quantitySupplied: number;
  quantityMetric: string;
  quantityUsed?: number;
  usedDate?: string; // UTC ISO
}

export interface DiseaseControlInventoryGetResponse {
  success: boolean;
  data: DiseaseControlInventory[];
  message?: string;
}

export interface DiseaseControlInventory {
  inventoryId?: string;
  farmId: string;
  suppliedDate?: string; // UTC ISO
  invoiceNumber: string;
  supplier: string;
  diseaseControlItems: DiseaseControlInventoryItem[];
}

export interface CreateDiseaseControlInventoryDto {
  farmId: string;
  suppliedDate?: string | Date;
  diseaseControlItems: DiseaseControlInventoryItem[];
  supplier: string;
  invoiceNumber: string;
}

@Injectable({ providedIn: 'root' })
export class DiseaseControlInventoryService {
  private api = `${environment.baseApiUrl}api/diseasecontrolinventory`;

  constructor(private http: HttpClient) {}

  private toUtcIso(d?: Date | null) {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())).toISOString();
  }

  create(item: CreateDiseaseControlInventoryDto | any): Observable<any> {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    return this.http.post(`${this.api}/AddDiseaseControlInventory`, payload);
  }

  list(farmId: string): Observable<DiseaseControlInventoryGetResponse> { 
    return this.http.get<DiseaseControlInventoryGetResponse>(`${this.api}/GetAllFarmInventory/${farmId}`); 
  }

  get(inventoryId: string): Observable<DiseaseControlInventory> { 
    return this.http.get<DiseaseControlInventory>(`${this.api}/${inventoryId}`); 
  }

  update(inventoryId: string, item: Partial<CreateDiseaseControlInventoryDto> & { suppliedDate?: Date | string, usedDate?: Date | string }) {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    if ((item.usedDate as any) instanceof Date) payload.usedDate = this.toUtcIso(item.usedDate as Date);
    return this.http.put(`${this.api}/${inventoryId}`, payload);
  }

  delete(inventoryId: string) { 
    return this.http.delete(`${this.api}/RemoveInventory/${inventoryId}`); 
  }
}