import { TestBed } from '@angular/core/testing';

import { WebAuthnService } from './web-authn.service';

describe('WebAuthService', () => {
  let service: WebAuthnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebAuthnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
