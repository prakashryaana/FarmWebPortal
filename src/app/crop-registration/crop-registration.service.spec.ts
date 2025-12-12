import { TestBed } from '@angular/core/testing';

import { CropRegistrationService } from '../crop-registration/crop-registration.service';

describe('CropRegistrationService', () => {
  let service: CropRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CropRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
