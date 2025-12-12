import { TestBed } from '@angular/core/testing';

import { AddActivityService } from '../add-activity/add-activity.service';

describe('AddActivityService', () => {
  let service: AddActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
