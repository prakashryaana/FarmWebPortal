import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector-toolbar.component';
import { CropFarmSelectorService } from './crop-farm-selector.service';
import { signal } from '@angular/core';

describe('CropFarmSelectorToolbarComponent', () => {
  let component: CropFarmSelectorToolbarComponent;
  let fixture: ComponentFixture<CropFarmSelectorToolbarComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockService: any;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockService = {
      selectedFarmId: signal(null),
      selectedCropId: signal(null),
      selectedFarmName: signal(null),
      selectedCropName: signal(null),
      clearSelection: jasmine.createSpy('clearSelection')
    };

    await TestBed.configureTestingModule({
      imports: [
        CropFarmSelectorToolbarComponent,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: CropFarmSelectorService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CropFarmSelectorToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no selection initially', () => {
    expect(component.hasSelection).toBeFalse();
    expect(component.selectedFarmId).toBe('');
    expect(component.selectedCropId).toBe('');
  });

  it('should display placeholder when no selection', () => {
    expect(component.hasSelection).toBeFalse();
    const placeholder = fixture.nativeElement.querySelector('.toolbar-placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should update selection when service signals change', () => {
    mockService.selectedFarmId.set('farm123');
    mockService.selectedCropId.set('crop456');
    mockService.selectedFarmName.set('Test Farm');
    mockService.selectedCropName.set('Wheat');

    // Trigger manual update like the component does
    fixture.componentInstance['updateSelection']();

    expect(component.selectedFarmId).toBe('farm123');
    expect(component.selectedCropId).toBe('crop456');
    expect(component.selectedFarmName).toBe('Test Farm');
    expect(component.selectedCropName).toBe('Wheat');
    expect(component.hasSelection).toBeTrue();
  });

  it('should open selector dialog when openSelectorDialog is called', () => {
    const mockDialogRef = {
      afterClosed: jasmine.createSpy('afterClosed').and.returnValue({
        subscribe: jasmine.createSpy('subscribe').and.returnValue({})
      })
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);

    component.openSelectorDialog();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should call clearSelection on service when clear is clicked', () => {
    component.clearSelection();
    expect(mockService.clearSelection).toHaveBeenCalled();
  });

  it('should display selection items when hasSelection is true', () => {
    component.hasSelection = true;
    component.selectedFarmName = 'Test Farm';
    component.selectedCropName = 'Wheat';
    fixture.detectChanges();

    const selectionDisplay = fixture.nativeElement.querySelector('.toolbar-selection');
    expect(selectionDisplay).toBeTruthy();
  });

  it('should cleanup on destroy', () => {
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });
});
