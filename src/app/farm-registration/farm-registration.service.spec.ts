import { TestBed } from '@angular/core/testing';

import { FarmRegistrationService } from '../farm-registration/farm-registration.service';

describe('FarmRegistrationService', () => {
  let service: FarmRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FarmRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
