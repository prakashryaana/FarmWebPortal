import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagicCallbackComponent } from './magic-callback.component';

describe('MagicCallbackComponent', () => {
  let component: MagicCallbackComponent;
  let fixture: ComponentFixture<MagicCallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagicCallbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MagicCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
