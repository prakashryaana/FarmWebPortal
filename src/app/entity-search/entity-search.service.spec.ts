import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EntitySearchService } from './entity-search.service';
import { environment } from '../../environments/environment';

describe('EntitySearchService', () => {
  let service: EntitySearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EntitySearchService]
    });
    service = TestBed.inject(EntitySearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search for FarmOwner entities', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' }
      ],
      message: 'Search successful'
    };

    service.searchEntity('FarmOwner', 'John').subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('OWNER-001');
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/Owner/search') &&
      request.params.has('searchTerm')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should search for FarmHelp entities', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 'HELP-001', name: 'Jane Smith', contactNumber: '+91-9876543211' }
      ],
      message: 'Search successful'
    };

    service.searchEntity('FarmHelp', 'Jane').subscribe(result => {
      expect(result.success).toBe(true);
      expect(result.data[0].id).toBe('HELP-001');
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/Maintainer/search') &&
      request.params.has('searchTerm')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should search for Farm entities', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 'FARM-001', name: 'Green Valley Farm', shadeNetArea: '1000 sqm' }
      ],
      message: 'Search successful'
    };

    service.searchEntity('Farm', 'Green').subscribe(result => {
      expect(result.success).toBe(true);
      //expect(result.data[0].shadeNetArea).toBe('1000 sqm');
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/Farm/search') &&
      request.params.has('searchTerm')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle search error', () => {
    service.searchEntity('FarmOwner', 'test').subscribe(
      () => {},
      error => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/Owner/search')
    );
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
