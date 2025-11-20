import { TestBed } from '@angular/core/testing';

import { MaintainerRegistrationService } from '../maintainer-registration/maintainer-registration.service';

describe('MaintainerRegistrationService', () => {
  let service: MaintainerRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintainerRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
