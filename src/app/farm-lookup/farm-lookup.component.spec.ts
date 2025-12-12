import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmSearchComponent } from './farm-lookup.component';

describe('FarmSearchComponent', () => {
  let component: FarmSearchComponent;
  let fixture: ComponentFixture<FarmSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
