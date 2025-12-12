import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmWeatherComponent } from './farm-weather.component';

describe('FarmWeatherComponent', () => {
  let component: FarmWeatherComponent;
  let fixture: ComponentFixture<FarmWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmWeatherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmWeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
