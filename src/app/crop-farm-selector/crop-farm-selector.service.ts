import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';

export interface CropOption {
  farmId: string;
  farmName: string;
  cropId: string;
  cropName: string;
}

export interface SelectedCropFarm {
  farmId: string;
  farmName: string;
  cropId: string;
  cropName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CropFarmSelectorService {
  private readonly apiUrl = environment.baseApiUrl;

  // State signals for reactive updates
  private selectedFarmIdSignal = signal<string | null>(null);
  private selectedCropIdSignal = signal<string | null>(null);
  private selectedFarmNameSignal = signal<string | null>(null);
  private selectedCropNameSignal = signal<string | null>(null);

  // Public computed signals for read-only access
  selectedFarmId = computed(() => this.selectedFarmIdSignal());
  selectedCropId = computed(() => this.selectedCropIdSignal());
  selectedFarmName = computed(() => this.selectedFarmNameSignal());
  selectedCropName = computed(() => this.selectedCropNameSignal());

  selectedCropFarm = computed(() => {
    const farmId = this.selectedFarmIdSignal();
    const cropId = this.selectedCropIdSignal();
    const farmName = this.selectedFarmNameSignal();
    const cropName = this.selectedCropNameSignal();

    if (farmId && cropId && farmName && cropName) {
      return {
        farmId,
        farmName,
        cropId,
        cropName
      } as SelectedCropFarm;
    }
    return null;
  });

  // Search results signal for reactive updates
  private searchResultsSignal = signal<CropOption[]>([]);
  // Subject for observable stream with automatic synchronization
  private searchResultsSubject = new BehaviorSubject<CropOption[]>([]);
    //searchResults$: Observable<CropOption[]> = this.searchResultsSubjectasObservable();
    searchResults$: Observable<CropOption[]> = this.searchResultsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPersistedSelection();
    
    // Keep signal and subject in sync
    effect(() => {
      const results = this.searchResultsSignal();
      this.searchResultsSubject.next(results);
    });
  }

  /**
   * Search for crop/farm combinations based on search query
   * Supports searching by cropId, cropName, farmId, or farmName
   */
  searchCropFarm(searchQuery: string): Observable<CropOption[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      this.searchResultsSignal.set([]);
      return of([]);
    }

    // First, search for farms matching the query (by farmId or farmName)
    return this.http.get<any[]>(`${this.apiUrl}api/Farm/search`, {
      params: new HttpParams().set('searchTerm', searchQuery)
    }).pipe(
      switchMap((farms: any[]) => {
        // For each farm, get its crops and combine into CropOption objects
        const options: CropOption[] = [];

        farms
        .filter(farm => Array.isArray(farm.cropDetail) && farm.cropDetail.length > 0)
        .forEach(farm => {
          // Assuming farm has Crops array with cropIds, or we need to fetch them
          if (farm.cropDetail && Array.isArray(farm.cropDetail)) {
            // If Crops is an array of IDs, we'd need to fetch full crop data
            // For now, assuming Crops contains crop objects with cropId and cropName
            farm.cropDetail.forEach((crop: any) => {
              options.push({
                farmId: farm.farmId || farm.Id,
                farmName: farm.farmName || farm.FarmName,
                cropId: crop.cropId || crop,
                cropName: crop.cropName || ''
              });
            });
          }
        });

        farms
        .filter(farm => !Array.isArray(farm.cropDetail) || farm.cropDetail.length === 0)
        .forEach(farm => {
          options.push({
            farmId: farm.farmId || farm.Id,
            farmName: farm.farmName || farm.FarmName,
            cropId: environment.tempCropId,
            cropName: environment.tempCropName
          });
        });

        // Also search crops directly by name/id
        return this.http.get<any[]>(`${this.apiUrl}api/Crop/search`, {
          params: new HttpParams().set('searchTerm', searchQuery)
        }).pipe(
          map((crops: any[] | undefined) => {
            if (crops && Array.isArray(crops)) {
              // For each crop found, add it with farm information if available
              crops.forEach(crop => {
                // Check if we already have this crop-farm combination
                const exists = options.some(opt =>
                  opt.cropId === (crop.cropId || crop.Id)
                );
                if (!exists && crop.FarmId) {
                  // Try to get farm details
                  options.push({
                    farmId: crop.FarmId,
                    farmName: crop.FarmName || 'Unknown Farm',
                    cropId: crop.cropId || crop.Id,
                    cropName: crop.cropName || crop.CropName || 'Unknown Crop'
                  });
                }
              });
            }
            return options;
          }),
          catchError(() => of(options))
        );
      }),
      tap(options => this.searchResultsSignal.set(options)),
      catchError(error => {
        console.error('Search error:', error);
        this.searchResultsSignal.set([]);
        return of([]);
      })
    );
  }

  getCropFarmForUser(): Observable<CropOption[]> {
    // First, search for farms matching the query (by farmId or farmName)
    return this.http.get<any[]>(`${this.apiUrl}api/Farm/GetAllFarmCropByUser`).pipe(
      switchMap((farms: any[]) => {
        // For each farm, get its crops and combine into CropOption objects
        const options: CropOption[] = [];

        farms
        .filter(farm => Array.isArray(farm.cropDetail) && farm.cropDetail.length > 0)
        .forEach(farm => {
          // Assuming farm has Crops array with cropIds, or we need to fetch them
          if (farm.cropDetail && Array.isArray(farm.cropDetail)) {
            // If Crops is an array of IDs, we'd need to fetch full crop data
            // For now, assuming Crops contains crop objects with cropId and cropName
            farm.cropDetail.forEach((crop: any) => {
              options.push({
                farmId: farm.farmId || farm.Id,
                farmName: farm.farmName || farm.FarmName,
                cropId: crop.cropId || crop,
                cropName: crop.cropName || ''
              });
            });
          }
        });


        farms
        .filter(farm => !Array.isArray(farm.cropDetail) || farm.cropDetail.length === 0)
        .forEach(farm => {
          options.push({
            farmId: farm.farmId || farm.Id,
            farmName: farm.farmName || farm.FarmName,
            cropId: environment.tempCropId,
            cropName: environment.tempCropName
          });
        });


        return of(options);
      }),
      tap(options => {
        console.log('getCropFarmForUser options:', options);
        this.searchResultsSignal.set(options);
      }),
      catchError(error => {
        console.error('Search error:', error);
        this.searchResultsSignal.set([]);
        return of([]);
      })
    );
    }

  /**
   * Select a crop-farm combination and persist it
   */
  selectCropFarm(option: CropOption): void {
    this.selectedFarmIdSignal.set(option.farmId);
    this.selectedCropIdSignal.set(option.cropId);
    this.selectedFarmNameSignal.set(option.farmName);
    this.selectedCropNameSignal.set(option.cropName);

    // Persist to session storage
    this.persistSelection();
  }

  /**
   * Clear the selected crop-farm
   */
  clearSelection(): void {
    this.selectedFarmIdSignal.set(null);
    this.selectedCropIdSignal.set(null);
    this.selectedFarmNameSignal.set(null);
    this.selectedCropNameSignal.set(null);
    this.persistSelection();
  }

  /**
   * Persist selection to session storage
   */
  private persistSelection(): void {
    const selection = {
      farmId: this.selectedFarmIdSignal(),
      cropId: this.selectedCropIdSignal(),
      farmName: this.selectedFarmNameSignal(),
      cropName: this.selectedCropNameSignal()
    };
    sessionStorage.setItem('selectedCropFarm', JSON.stringify(selection));
  }

  /**
   * Load persisted selection from session storage
   */
  private loadPersistedSelection(): void {
    const stored = sessionStorage.getItem('selectedCropFarm');
    if (stored) {
      try {
        const selection = JSON.parse(stored);
        if (selection.farmId && selection.cropId) {
          this.selectedFarmIdSignal.set(selection.farmId);
          this.selectedCropIdSignal.set(selection.cropId);
          this.selectedFarmNameSignal.set(selection.farmName);
          this.selectedCropNameSignal.set(selection.cropName);
        }
      } catch (e) {
        console.error('Failed to load persisted crop-farm selection:', e);
      }
    }
  }

  /**
   * Get search results as signal (modern approach)
   */
  getSearchResultsSignal() {
    return this.searchResultsSignal.asReadonly();
  }

  /**
   * Get search results as observable (legacy approach for backwards compatibility)
   */
  getSearchResults(): Observable<CropOption[]> {
    return this.searchResults$;
  }
}
