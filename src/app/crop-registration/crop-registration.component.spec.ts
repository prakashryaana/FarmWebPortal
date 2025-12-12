import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropRegistrationComponent } from './crop-registration.component';

describe('CropRegistrationComponent', () => {
  let component: CropRegistrationComponent;
  let fixture: ComponentFixture<CropRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CropRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
