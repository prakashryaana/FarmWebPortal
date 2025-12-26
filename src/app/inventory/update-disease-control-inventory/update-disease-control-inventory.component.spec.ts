import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateDiseaseControlInventoryComponent } from './update-disease-control-inventory.component';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

describe('UpdateDiseaseControlInventoryComponent', () => {
  let component: UpdateDiseaseControlInventoryComponent;
  let fixture: ComponentFixture<UpdateDiseaseControlInventoryComponent>;
  let mockService: jasmine.SpyObj<DiseaseControlInventoryService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockData: DiseaseControlInventory[] = [
    {
      id: '1',
      diseaseControlName: 'Copper Fungicide',
      quantitySupplied: 50.25,
      suppliedDate: '2024-01-10T09:00:00Z',
      quantityUsed: 20.00,
      usedDate: '2024-02-05T10:30:00Z'
    },
    {
      id: '2',
      diseaseControlName: 'Sulfur Powder',
      quantitySupplied: 75.50,
      suppliedDate: '2024-01-15T11:00:00Z',
      quantityUsed: 35.75,
      usedDate: '2024-02-20T14:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('DiseaseControlInventoryService', ['list', 'create', 'update', 'delete']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [UpdateDiseaseControlInventoryComponent],
      providers: [
        { provide: DiseaseControlInventoryService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    mockService.list.and.returnValue(of(mockData));
    fixture = TestBed.createComponent(UpdateDiseaseControlInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load disease control list on init', () => {
    expect(mockService.list).toHaveBeenCalled();
    expect(component.list.length).toBe(2);
    expect(component.list[0].diseaseControlName).toBe('Copper Fungicide');
  });

  describe('Create Operations', () => {
    it('should open create form', () => {
      component.openCreateForm();
      expect(component.isFormExpanded).toBe(true);
      expect(component.editingId).toBeNull();
    });

    it('should submit create with valid form', () => {
      mockService.create.and.returnValue(of({}));

      component.form.patchValue({
        diseaseControlName: 'Neem Oil',
        quantitySupplied: 60.00,
        suppliedDate: new Date(),
        quantityUsed: 25.50,
        usedDate: new Date()
      });

      component.submit();

      expect(mockService.create).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created successfully', 'Close', { duration: 3000 });
      expect(component.isFormExpanded).toBe(false);
    });

    it('should show error on create failure', () => {
      mockService.create.and.returnValue(throwError(() => new Error('Create failed')));

      component.form.patchValue({
        diseaseControlName: 'Neem Oil',
        quantitySupplied: 60.00,
        suppliedDate: new Date(),
        quantityUsed: 25.50,
        usedDate: new Date()
      });

      component.submit();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Create failed', 'Close', { duration: 4000 });
    });

    it('should not submit with invalid form', () => {
      component.form.reset();
      component.submit();
      expect(mockService.create).not.toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Please fill all required fields', 'Close', { duration: 3000 });
    });
  });

  describe('Edit Operations', () => {
    it('should select item for edit and expand form', () => {
      const item = mockData[0];
      component.selectForEdit(item);

      expect(component.isFormExpanded).toBe(true);
      expect(component.editingId).toBe('1');
      expect(component.form.get('diseaseControlName')?.value).toBe('Copper Fungicide');
      expect(component.form.get('quantitySupplied')?.value).toBe(50.25);
    });

    it('should submit update with valid form', () => {
      mockService.update.and.returnValue(of({}));

      component.selectForEdit(mockData[0]);
      component.form.patchValue({
        diseaseControlName: 'Copper Fungicide (Updated)',
        quantityUsed: 25.00
      });

      component.submit();

      expect(mockService.update).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Updated successfully', 'Close', { duration: 3000 });
      expect(component.isFormExpanded).toBe(false);
    });

    it('should show error on update failure', () => {
      mockService.update.and.returnValue(throwError(() => new Error('Update failed')));

      component.selectForEdit(mockData[0]);
      component.form.patchValue({ diseaseControlName: 'Updated' });

      component.submit();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed', 'Close', { duration: 4000 });
    });
  });

  describe('Delete Operations', () => {
    it('should delete item after confirmation', () => {
      mockService.delete.and.returnValue(of({}));
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockData[0]);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockService.delete).toHaveBeenCalledWith('1');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Deleted successfully', 'Close', { duration: 3000 });
    });

    it('should not delete if user cancels', () => {
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockData[0]);

      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it('should show error on delete failure', () => {
      mockService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockData[0]);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Delete failed', 'Close', { duration: 4000 });
    });
  });

  describe('Form Management', () => {
    it('should close form and reset', () => {
      component.isFormExpanded = true;
      component.editingId = '1';
      component.form.patchValue({ diseaseControlName: 'Test' });

      component.closeForm();

      expect(component.isFormExpanded).toBe(false);
      expect(component.editingId).toBeNull();
      expect(component.form.get('diseaseControlName')?.value).toBeNull();
    });

    it('should format quantity to 2 decimal places', () => {
      component.form.patchValue({
        diseaseControlName: 'Test Control',
        quantitySupplied: 100.555,
        quantityUsed: 50.444,
        suppliedDate: new Date(),
        usedDate: new Date()
      });

      const payload = (component as any).buildPayload();

      expect(payload.quantitySupplied).toBe(100.56);
      expect(payload.quantityUsed).toBe(50.44);
    });
  });

  describe('Data Refresh', () => {
    it('should reload list after create', () => {
      mockService.create.and.returnValue(of({}));
      mockService.list.calls.reset();
      mockService.list.and.returnValue(of(mockData));

      component.form.patchValue({
        diseaseControlName: 'New Control',
        quantitySupplied: 80.00,
        suppliedDate: new Date(),
        quantityUsed: 30.00,
        usedDate: new Date()
      });

      component.submit();

      expect(mockService.list).toHaveBeenCalled();
    });

    it('should reload list after delete', () => {
      mockService.delete.and.returnValue(of({}));
      mockService.list.calls.reset();
      mockService.list.and.returnValue(of(mockData));

      const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(mockDialogRef);

      component.delete(mockData[0]);

      expect(mockService.list).toHaveBeenCalled();
    });
  });
});
