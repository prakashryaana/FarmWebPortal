import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type EntityType = 'FarmOwner' | 'FarmHelp' | 'Farm';

export interface FarmOwnerSearchResult {
  id: string;
  name: string;
  contactNumber: string;
}

export interface FarmHelpSearchResult {
  id: string;
  name: string;
  contactNumber: string;
}

export interface FarmSearchResult {
  id: string;
  name: string;
  shadeNetArea: string;
}

export type SearchResult = FarmOwnerSearchResult | FarmHelpSearchResult | FarmSearchResult;

export interface EntitySearchResponse {
  success: boolean;
  data: SearchResult[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntitySearchService {
  private apiUrl = `${environment.baseApiUrl}api`;

  constructor(private http: HttpClient) {}

  /**
   * Search for entities based on entity type and search term
   * @param entityType Type of entity to search for (FarmOwner, FarmHelp, Farm)
   * @param searchTerm Search term (entityId or entityName)
   * @returns Observable of EntitySearchResponse
   */
  searchEntity(entityType: EntityType, searchTerm: string): Observable<EntitySearchResponse> {
    const params = new HttpParams().set('searchTerm', encodeURIComponent(searchTerm.trim()));

    return this.http.get<EntitySearchResponse>(
      `${this.apiUrl}/${this.getEndpoint(entityType)}/searchEntity`,
      { params }
    );
  }

  /**
   * Get the API endpoint for the entity type
   */
  private getEndpoint(entityType: EntityType): string {
    const endpoints: Record<EntityType, string> = {
      'FarmOwner': 'Owner',
      'FarmHelp': 'Maintainer',
      'Farm': 'Farm'
    };
    return endpoints[entityType];
  }
}
