import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmRegistrationComponent } from './farm-registration.component';

describe('FarmRegistrationComponent', () => {
  let component: FarmRegistrationComponent;
  let fixture: ComponentFixture<FarmRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
