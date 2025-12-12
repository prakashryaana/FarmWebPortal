import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { CropFarmSelectorService } from './crop-farm-selector.service';

describe('CropFarmSelectorService', () => {
  let service: CropFarmSelectorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CropFarmSelectorService]
    });
    service = TestBed.inject(CropFarmSelectorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no selection', () => {
    expect(service.selectedFarmId()).toBeNull();
    expect(service.selectedCropId()).toBeNull();
    expect(service.selectedFarmName()).toBeNull();
    expect(service.selectedCropName()).toBeNull();
  });

  it('should select crop farm and persist to session storage', () => {
    const option = {
      farmId: 'farm123',
      farmName: 'Test Farm',
      cropId: 'crop456',
      cropName: 'Wheat'
    };

    service.selectCropFarm(option);

    expect(service.selectedFarmId()).toBe('farm123');
    expect(service.selectedCropId()).toBe('crop456');
    expect(service.selectedFarmName()).toBe('Test Farm');
    expect(service.selectedCropName()).toBe('Wheat');

    // Verify persistence
    const stored = sessionStorage.getItem('selectedCropFarm');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.farmId).toBe('farm123');
    expect(parsed.cropId).toBe('crop456');
  });

  it('should clear selection', () => {
    const option = {
      farmId: 'farm123',
      farmName: 'Test Farm',
      cropId: 'crop456',
      cropName: 'Wheat'
    };

    service.selectCropFarm(option);
    expect(service.selectedFarmId()).toBe('farm123');

    service.clearSelection();

    expect(service.selectedFarmId()).toBeNull();
    expect(service.selectedCropId()).toBeNull();
    expect(service.selectedFarmName()).toBeNull();
    expect(service.selectedCropName()).toBeNull();
  });

  it('should load persisted selection from session storage', () => {
    const selection = {
      farmId: 'farm789',
      cropId: 'crop789',
      farmName: 'Persisted Farm',
      cropName: 'Corn'
    };

    sessionStorage.setItem('selectedCropFarm', JSON.stringify(selection));

    // Create new service instance to trigger loadPersistedSelection
    const httpClient = TestBed.inject(HttpClient);
    const newService = new CropFarmSelectorService(httpClient);
    expect(newService.selectedFarmId()).toBe('farm789');
    expect(newService.selectedCropId()).toBe('crop789');
  });

  it('should compute selectedCropFarm from individual signals', () => {
    const option = {
      farmId: 'farm123',
      farmName: 'Test Farm',
      cropId: 'crop456',
      cropName: 'Wheat'
    };

    service.selectCropFarm(option);

    const selected = service.selectedCropFarm();
    expect(selected).toBeTruthy();
    expect(selected!.farmId).toBe('farm123');
    expect(selected!.cropId).toBe('crop456');
  });

  it('should return null from selectedCropFarm when no selection', () => {
    const selected = service.selectedCropFarm();
    expect(selected).toBeNull();
  });

  it('should provide search results observable', (done) => {
    service.getSearchResults().subscribe(results => {
      expect(Array.isArray(results)).toBeTruthy();
      done();
    });
  });

  it('should provide search results signal', () => {
    const signal = service.getSearchResultsSignal();
    expect(signal).toBeTruthy();
  });
});
