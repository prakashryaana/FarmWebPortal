import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmOwnerRegistration } from './farm-owner-registration.component';

describe('FarmOwnerRegistration', () => {
  let component: FarmOwnerRegistration;
  let fixture: ComponentFixture<FarmOwnerRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmOwnerRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmOwnerRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
