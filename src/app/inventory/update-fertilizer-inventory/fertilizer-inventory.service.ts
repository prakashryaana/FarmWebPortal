import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FertilizerInventoryItem {
  fertilizerName: string;
  quantitySupplied: number;
  quantityMetric: string;
  quantityUsed?: number;
  usedDate?: string; // UTC ISO
}

export interface FertilizerInventoryGetResponse {
  success: boolean;
  data: FertilizerInventory[];
  message?: string;
}

export interface FertilizerInventory {
  inventoryId?: string;
  farmId: string;
  suppliedDate?: string; // UTC ISO
  invoiceNumber: string;
  supplier: string;
  fertilizerItems: FertilizerInventoryItem[];
}

export interface CreateFertilizerInventoryDto {
  farmId: string;
  suppliedDate?: string | Date;
  fertilizerItems: FertilizerInventoryItem[];
  supplier: string;
  invoiceNumber: string;
}

@Injectable({ providedIn: 'root' })
export class FertilizerInventoryService {
  private api = `${environment.baseApiUrl}api/fertilizerinventory`;

  constructor(private http: HttpClient) {}

  private toUtcIso(d?: Date | null) {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())).toISOString();
  }

  create(item: CreateFertilizerInventoryDto | any): Observable<any> {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    return this.http.post(`${this.api}/AddFertilizerInventory`, payload);
  }

  list(farmId: string): Observable<FertilizerInventoryGetResponse> { 
    return this.http.get<FertilizerInventoryGetResponse>(`${this.api}/GetAllFarmInventory/${farmId}`); 
  }

  get(inventoryId: string): Observable<FertilizerInventory> { 
    return this.http.get<FertilizerInventory>(`${this.api}/${inventoryId}`); 
  }

  update(inventoryId: string, item: Partial<CreateFertilizerInventoryDto> & { suppliedDate?: Date | string, usedDate?: Date | string }) {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    if ((item.usedDate as any) instanceof Date) payload.usedDate = this.toUtcIso(item.usedDate as Date);
    return this.http.put(`${this.api}/${inventoryId}`, payload);
  }

  delete(inventoryId: string) { 
    return this.http.delete(`${this.api}/RemoveInventory/${inventoryId}`); 
  }

  getInputCatalogNames(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/GetInputCatalogNames/${type}`);
  }

  createInputCatalog(catalog: { type: string, name: string }): Observable<any> {
    return this.http.post(`${this.api}/CreateInputCatalog`, catalog);
  }

  deleteInputCatalog(type: string, name: string): Observable<any> {
    return this.http.delete(`${this.api}/RemoveInputCatalog/${type}/${name}`);
  }
}
