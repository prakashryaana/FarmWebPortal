import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FertilizerInventory {
  inventoryId?: string;
  fertilizerName: string;
  farmId: string;
  quantitySupplied: number;
  suppliedDate?: string; // UTC ISO
  quantityUsed: number;
  usedDate?: string; // UTC ISO
}

@Injectable({ providedIn: 'root' })
export class FertilizerInventoryService {
  private api = `${environment.baseApiUrl}api/fertilizerinventory`;

  constructor(private http: HttpClient) {}

  private toUtcIso(d?: Date | null) {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())).toISOString();
  }

  create(item: Partial<FertilizerInventory> & { suppliedDate?: Date | string, usedDate?: Date | string }): Observable<any> {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    if ((item.usedDate as any) instanceof Date) payload.usedDate = this.toUtcIso(item.usedDate as Date);
    return this.http.post(`${this.api}/AddFertilizerInventory`, payload);
  }

  list(farmId: string): Observable<FertilizerInventory[]> { return this.http.get<FertilizerInventory[]>(`${this.api}/GetAllFarmInventory/${farmId}`); }
  get(inventoryId: string): Observable<FertilizerInventory> { return this.http.get<FertilizerInventory>(`${this.api}/${inventoryId}`); }
  update(inventoryId: string, item: Partial<FertilizerInventory> & { suppliedDate?: Date | string, usedDate?: Date | string }) {
    const payload = { ...item } as any;
    if ((item.suppliedDate as any) instanceof Date) payload.suppliedDate = this.toUtcIso(item.suppliedDate as Date);
    if ((item.usedDate as any) instanceof Date) payload.usedDate = this.toUtcIso(item.usedDate as Date);
    return this.http.put(`${this.api}/${inventoryId}`, payload);
  }
  delete(inventoryId: string) { return this.http.delete(`${this.api}/RemoveInventory/${inventoryId}`); }
}
