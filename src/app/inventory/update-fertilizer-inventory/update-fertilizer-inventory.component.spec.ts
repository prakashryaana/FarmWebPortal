import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateFertilizerInventoryComponent } from './update-fertilizer-inventory.component';
import { FertilizerInventoryService, FertilizerInventory } from './fertilizer-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

describe('UpdateFertilizerInventoryComponent', () => {
  let component: UpdateFertilizerInventoryComponent;
  let fixture: ComponentFixture<UpdateFertilizerInventoryComponent>;
  let mockService: jasmine.SpyObj<FertilizerInventoryService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockData: FertilizerInventory[] = [
    {
      id: '1',
      fertilizerName: 'NPK 10:26:26',
      quantitySupplied: 100.50,
      suppliedDate: '2024-01-15T10:00:00Z',
      quantityUsed: 45.25,
      usedDate: '2024-02-10T14:30:00Z'
    },
    {
      id: '2',
      fertilizerName: 'Urea',
      quantitySupplied: 200.00,
      suppliedDate: '2024-01-20T11:00:00Z',
      quantityUsed: 120.75,
      usedDate: '2024-02-15T15:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('FertilizerInventoryService', ['list', 'create', 'update', 'delete']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [UpdateFertilizerInventoryComponent],
      providers: [
        { provide: FertilizerInventoryService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    mockService.list.and.returnValue(of(mockData));
    fixture = TestBed.createComponent(UpdateFertilizerInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load fertilizer list on init', () => {
    expect(mockService.list).toHaveBeenCalled();
    expect(component.list.length).toBe(2);
    expect(component.list[0].fertilizerName).toBe('NPK 10:26:26');
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
        fertilizerName: 'DAP',
        quantitySupplied: 150.00,
        suppliedDate: new Date(),
        quantityUsed: 50.00,
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
        fertilizerName: 'DAP',
        quantitySupplied: 150.00,
        suppliedDate: new Date(),
        quantityUsed: 50.00,
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
      expect(component.form.get('fertilizerName')?.value).toBe('NPK 10:26:26');
      expect(component.form.get('quantitySupplied')?.value).toBe(100.50);
    });

    it('should submit update with valid form', () => {
      mockService.update.and.returnValue(of({}));

      component.selectForEdit(mockData[0]);
      component.form.patchValue({
        fertilizerName: 'NPK 10:26:26 (Updated)',
        quantityUsed: 50.00
      });

      component.submit();

      expect(mockService.update).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Updated successfully', 'Close', { duration: 3000 });
      expect(component.isFormExpanded).toBe(false);
    });

    it('should show error on update failure', () => {
      mockService.update.and.returnValue(throwError(() => new Error('Update failed')));

      component.selectForEdit(mockData[0]);
      component.form.patchValue({ fertilizerName: 'Updated' });

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
      component.form.patchValue({ fertilizerName: 'Test' });

      component.closeForm();

      expect(component.isFormExpanded).toBe(false);
      expect(component.editingId).toBeNull();
      expect(component.form.get('fertilizerName')?.value).toBeNull();
    });

    it('should format quantity to 2 decimal places', () => {
      component.form.patchValue({
        fertilizerName: 'Test Fertilizer',
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
        fertilizerName: 'New Fertilizer',
        quantitySupplied: 100.00,
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
