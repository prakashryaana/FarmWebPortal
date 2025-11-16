import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintainerRegistrationComponent } from './maintainer-registration.component';

describe('MaintainerRegistrationComponent', () => {
  let component: MaintainerRegistrationComponent;
  let fixture: ComponentFixture<MaintainerRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintainerRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintainerRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
