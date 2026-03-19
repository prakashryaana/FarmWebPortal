import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CameraControlComponent } from './camera-control.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

describe('CameraControlComponent', () => {
  let component: CameraControlComponent;
  let fixture: ComponentFixture<CameraControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CameraControlComponent,
        HttpClientTestingModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CameraControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have allowUpload defaulted to true', () => {
    expect(component.allowUpload).toBe(true);
  });

  it('should emit photoCapture output', (done) => {
    component.photoCapture.subscribe((output) => {
      expect(output.success).toBe(true);
      done();
    });

    component.allowUpload = false;
    component.capturedPhoto = 'data:image/jpeg;base64,sample';
    component.photoFileName = 'test.jpg';
    component.uploadPhoto();
  });

  it('should stop camera on destroy', () => {
    component.ngOnDestroy();
    expect(component.cameraMode).toBe(false);
  });
});
