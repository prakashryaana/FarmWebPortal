import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateCropMasterComponent } from './update-crop-master.component';
import { CropMasterService, CropMaster } from './crop-master.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

describe('UpdateCropMasterComponent', () => {
  let component: UpdateCropMasterComponent;
  let fixture: ComponentFixture<UpdateCropMasterComponent>;
  let mockCropMasterService: jasmine.SpyObj<CropMasterService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockCropData: CropMaster[] = [
    {
      cropId: '1',
      cropName: 'Tomato',
      duration: 60,
      expectedYield: 25.50,
      sowingTime: 'January-March',
      harvestTime: 'May-July',
      sowingMethod: 'Seedlings',
      moleculesToAdd: 'Nitrogen, Phosphorus',
      pestsAndDiseases: 'Leaf Spot, Fusarium Wilt'
    },
    {
      cropId: '2',
      cropName: 'Cucumber',
      duration: 45,
      expectedYield: 30.75,
      sowingTime: 'February-April',
      harvestTime: 'June-August',
      sowingMethod: 'Seedlings',
      moleculesToAdd: 'Potassium',
      pestsAndDiseases: 'Powdery Mildew'
    }
  ];

  beforeEach(async () => {
    mockCropMasterService = jasmine.createSpyObj('CropMasterService', ['list', 'create', 'update', 'delete']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [UpdateCropMasterComponent],
      providers: [
        { provide: CropMasterService, useValue: mockCropMasterService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    mockCropMasterService.list.and.returnValue(of(mockCropData));
    fixture = TestBed.createComponent(UpdateCropMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load crop list on init', () => {
    expect(mockCropMasterService.list).toHaveBeenCalled();
    expect(component.list.length).toBe(2);
    expect(component.list[0].cropName).toBe('Tomato');
  });

  describe('Create Operations', () => {
    it('should open create form', () => {
      component.openCreateForm();
      expect(component.isFormExpanded).toBe(true);
      expect(component.editingId).toBeNull();
    });

    it('should submit create with valid form', () => {
      mockCropMasterService.create.and.returnValue(of({}));
      
      component.form.patchValue({
        cropName: 'Pepper',
        duration: 70,
        expectedYield: 20.00,
        sowingTimeFromMonth: 'March',
        sowingTimeToMonth: 'May',
        harvestTimeFromMonth: 'July',
        harvestTimeToMonth: 'September',
        sowingMethod: 'Seedlings'
      });

      component.submit();

      expect(mockCropMasterService.create).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created successfully', 'Close', { duration: 3000 });
      expect(component.isFormExpanded).toBe(false);
    });

    it('should show error on create failure', () => {
      mockCropMasterService.create.and.returnValue(throwError(() => new Error('Create failed')));
      
      component.form.patchValue({
        cropName: 'Pepper',
        duration: 70,
        expectedYield: 20.00,
        sowingTimeFromMonth: 'March',
        sowingTimeToMonth: 'May',
        harvestTimeFromMonth: 'July',
        harvestTimeToMonth: 'September',
        sowingMethod: 'Seedlings'
      });

      component.submit();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Create failed', 'Close', { duration: 4000 });
    });

    it('should not submit with invalid form', () => {
      component.form.reset();
      component.submit();
      expect(mockCropMasterService.create).not.toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Please fill all required fields', 'Close', { duration: 3000 });
    });
  });

  describe('Edit Operations', () => {
    it('should select item for edit and expand form', () => {
      const crop = mockCropData[0];
      component.selectForEdit(crop);

      expect(component.isFormExpanded).toBe(true);
      expect(component.editingId).toBe('1');
      expect(component.form.get('cropName')?.value).toBe('Tomato');
      expect(component.form.get('duration')?.value).toBe(60);
    });

    it('should submit update with valid form', () => {
      mockCropMasterService.update.and.returnValue(of({}));
      
      component.selectForEdit(mockCropData[0]);
      component.form.patchValue({
        cropName: 'Tomato (Updated)',
        duration: 65
      });

      component.submit();

      expect(mockCropMasterService.update).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Updated successfully', 'Close', { duration: 3000 });
      expect(component.isFormExpanded).toBe(false);
    });

    it('should show error on update failure', () => {
      mockCropMasterService.update.and.returnValue(throwError(() => new Error('Update failed')));
      
      component.selectForEdit(mockCropData[0]);
      component.form.patchValue({ cropName: 'Updated' });

      component.submit();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed', 'Close', { duration: 4000 });
    });

    it('should parse month ranges correctly on edit', () => {
      const crop = mockCropData[0];
      component.selectForEdit(crop);

      expect(component.form.get('sowingTimeFromMonth')?.value).toBe('January');
      expect(component.form.get('sowingTimeToMonth')?.value).toBe('March');
      expect(component.form.get('harvestTimeFromMonth')?.value).toBe('May');
      expect(component.form.get('harvestTimeToMonth')?.value).toBe('July');
    });
  });

  describe('Delete Operations', () => {
    it('should delete item after confirmation', () => {
      mockCropMasterService.delete.and.returnValue(of({}));
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockCropData[0]);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockCropMasterService.delete).toHaveBeenCalledWith('1');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Deleted successfully', 'Close', { duration: 3000 });
    });

    it('should not delete if user cancels', () => {
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockCropData[0]);

      expect(mockCropMasterService.delete).not.toHaveBeenCalled();
    });

    it('should show error on delete failure', () => {
      mockCropMasterService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockCropData[0]);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Delete failed', 'Close', { duration: 4000 });
    });
  });

  describe('Form Management', () => {
    it('should close form and reset', () => {
      component.isFormExpanded = true;
      component.editingId = '1';
      component.form.patchValue({ cropName: 'Test' });

      component.closeForm();

      expect(component.isFormExpanded).toBe(false);
      expect(component.editingId).toBeNull();
      expect(component.form.get('cropName')?.value).toBeNull();
    });

    it('should concatenate month ranges in normalized form', () => {
      component.form.patchValue({
        sowingTimeFromMonth: 'January',
        sowingTimeToMonth: 'March',
        harvestTimeFromMonth: 'May',
        harvestTimeToMonth: 'July',
        cropName: 'Test Crop',
        duration: 60,
        expectedYield: 25.50,
        sowingMethod: 'Seedlings'
      });

      const normalized = (component as any).normalizedForm();

      expect(normalized.sowingTime).toBe('January-March');
      expect(normalized.harvestTime).toBe('May-July');
    });
  });

  describe('Data Refresh', () => {
    it('should reload list after create', () => {
      mockCropMasterService.create.and.returnValue(of({}));
      mockCropMasterService.list.calls.reset();
      mockCropMasterService.list.and.returnValue(of(mockCropData));

      component.form.patchValue({
        cropName: 'New Crop',
        duration: 50,
        expectedYield: 22.00,
        sowingTimeFromMonth: 'April',
        sowingTimeToMonth: 'June',
        harvestTimeFromMonth: 'August',
        harvestTimeToMonth: 'September',
        sowingMethod: 'Seedlings'
      });

      component.submit();

      expect(mockCropMasterService.list).toHaveBeenCalled();
    });

    it('should reload list after delete', () => {
      mockCropMasterService.delete.and.returnValue(of({}));
      mockCropMasterService.list.calls.reset();
      mockCropMasterService.list.and.returnValue(of(mockCropData));
      
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockCropData[0]);

      expect(mockCropMasterService.list).toHaveBeenCalled();
    });
  });
});
