import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableFingerprintComponent } from './enable-fingerprint.component';

describe('EnableFingerprintComponent', () => {
  let component: EnableFingerprintComponent;
  let fixture: ComponentFixture<EnableFingerprintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnableFingerprintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnableFingerprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
