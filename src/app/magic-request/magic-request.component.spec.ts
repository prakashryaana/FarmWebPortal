import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagicRequestComponent } from './magic-request.component';

describe('MagicRequestComponent', () => {
  let component: MagicRequestComponent;
  let fixture: ComponentFixture<MagicRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagicRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MagicRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
