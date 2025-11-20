import { TestBed } from '@angular/core/testing';

import { FarmOwnerRegistrationService } from '../farm-owner-registration/farm-owner-registration.service';

describe('FarmOwnerRegistrationService', () => {
  let service: FarmOwnerRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FarmOwnerRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
