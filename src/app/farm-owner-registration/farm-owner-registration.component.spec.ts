import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmOwnerRegistrationComponent } from './farm-owner-registration.component';

describe('FarmOwnerRegistrationComponent', () => {
  let component: FarmOwnerRegistrationComponent;
  let fixture: ComponentFixture<FarmOwnerRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmOwnerRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmOwnerRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
