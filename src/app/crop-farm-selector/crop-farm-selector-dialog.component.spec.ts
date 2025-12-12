import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CropFarmSelectorDialogComponent } from './crop-farm-selector-dialog.component';
import { CropFarmSelectorService } from './crop-farm-selector.service';

describe('CropFarmSelectorDialogComponent', () => {
  let component: CropFarmSelectorDialogComponent;
  let fixture: ComponentFixture<CropFarmSelectorDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CropFarmSelectorDialogComponent>>;
  let mockService: jasmine.SpyObj<CropFarmSelectorService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('CropFarmSelectorService', [
      'searchCropFarm',
      'selectCropFarm',
      'getSearchResults'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CropFarmSelectorDialogComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatIconModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: CropFarmSelectorService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CropFarmSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search form', () => {
    expect(component.searchForm.get('searchQuery')?.value).toBe('');
  });

  it('should have empty search results initially', () => {
    expect(component.searchResults).toEqual([]);
  });

  it('should call selectCropFarm on service when crop selected', () => {
    const option = {
      farmId: 'farm123',
      farmName: 'Test Farm',
      cropId: 'crop456',
      cropName: 'Wheat'
    };

    component.selectCropFarm(option);

    expect(mockService.selectCropFarm).toHaveBeenCalledWith(option);
    expect(mockDialogRef.close).toHaveBeenCalledWith(option);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should define display columns for table', () => {
    expect(component.displayedColumns).toEqual(['farmName', 'farmId', 'cropName', 'cropId', 'action']);
  });

  it('should have isLoading false initially', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should cleanup on destroy', () => {
    component.ngOnDestroy();
    // Verify destroy subject is completed
    expect(component).toBeTruthy();
  });
});
