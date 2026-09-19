import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FarmNoteService } from './farm-note.service';

describe('FarmNoteService', () => {
  let service: FarmNoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FarmNoteService
      ]
    });
    service = TestBed.inject(FarmNoteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
