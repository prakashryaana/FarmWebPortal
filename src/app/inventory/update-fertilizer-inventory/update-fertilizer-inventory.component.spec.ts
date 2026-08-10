import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateFertilizerInventoryComponent } from './update-fertilizer-inventory.component';
import { FertilizerInventoryService, FertilizerInventory } from './fertilizer-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FormArray } from '@angular/forms';

describe('UpdateFertilizerInventoryComponent', () => {
  let component: UpdateFertilizerInventoryComponent;
  let fixture: ComponentFixture<UpdateFertilizerInventoryComponent>;
  let mockService: jasmine.SpyObj<FertilizerInventoryService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockData: FertilizerInventory[] = [
    {
      inventoryId: '1',
      farmId: 'farm1',
      invoiceNumber: 'INV-001',
      supplier: 'Supplier A',
      suppliedDate: '2024-01-15T10:00:00Z',
      fertilizerItems: [
        {
          fertilizerName: 'NPK 10:26:26',
          quantitySupplied: 100.50,
          quantityMetric: 'Packets',
          quantityUsed: 45.25,
          usedDate: '2024-02-10T14:30:00Z'
        }
      ]
    },
    {
      inventoryId: '2',
      farmId: 'farm1',
      invoiceNumber: 'INV-002',
      supplier: 'Supplier B',
      suppliedDate: '2024-01-20T11:00:00Z',
      fertilizerItems: [
        {
          fertilizerName: 'Urea',
          quantitySupplied: 200.00,
          quantityMetric: 'Packets',
          quantityUsed: 120.75,
          usedDate: '2024-02-15T15:00:00Z'
        }
      ]
    }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('FertilizerInventoryService', ['list', 'create', 'update', 'delete', 'getInputCatalogNames']);
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

    mockService.list.and.returnValue(of({ success: true, data: mockData }));
    mockService.getInputCatalogNames.and.returnValue(of(['NPK 10:26:26', 'Urea']));
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
    expect(component.list[0].invoiceNumber).toBe('INV-001');
    expect(component.list[0].fertilizerItems.length).toBe(1);
  });

  describe('Create Operations', () => {
    it('should open create form', () => {
      component.openCreateForm();
      expect(component.isFormExpanded).toBe(true);
      expect(component.editingId).toBeNull();
      expect(component.fertilizerItems.length).toBe(1);
    });

    it('should add fertilizer item to form array', () => {
      component.openCreateForm();
      const initialLength = component.fertilizerItems.length;
      component.addFertilizerItem();
      expect(component.fertilizerItems.length).toBe(initialLength + 1);
    });

    it('should submit create with valid form', () => {
      mockService.create.and.returnValue(of({}));

      component.openCreateForm();
      component.form.patchValue({
        invoiceNumber: 'INV-003',
        supplier: 'Test Supplier',
        suppliedDate: new Date()
      });
      component.fertilizerItems.at(0)?.patchValue({
        fertilizerName: 'NPK 10:26:26',
        quantitySupplied: 100.00,
        quantityMetric: 'Packets'
      });

      component.submit();

      expect(mockService.create).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created successfully', 'Close', { duration: 3000 });
    });

    it('should not submit with invalid form', () => {
      component.openCreateForm();
      component.form.reset();
      const fertilizerArray = component.form.get('fertilizerItems') as FormArray;
      fertilizerArray.clear();
      
      component.submit();
      expect(mockService.create).not.toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Please fill all required fields', 'Close', { duration: 3000 });
    });

    it('should show error on create failure', () => {
      mockService.create.and.returnValue(throwError(() => new Error('Create failed')));

      component.openCreateForm();
      component.form.patchValue({
        invoiceNumber: 'INV-003',
        supplier: 'Test Supplier'
      });

      component.submit();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Create failed', 'Close', { duration: 4000 });
    });
  });

  describe('Delete Operations', () => {
    it('should delete item after confirmation', () => {
      const deleteResponse = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(deleteResponse as any);
      mockService.delete.and.returnValue(of({}));

      component.delete(mockData[0]);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockService.delete).toHaveBeenCalledWith('1');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Deleted successfully', 'Close', { duration: 3000 });
    });

    it('should not delete item if confirmation cancelled', () => {
      const deleteResponse = { afterClosed: () => of(false) };
      mockDialog.open.and.returnValue(deleteResponse as any);

      component.delete(mockData[0]);

      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it('should show error on delete failure', () => {
      const deleteResponse = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(deleteResponse as any);
      mockService.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      component.delete(mockData[0]);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Delete failed', 'Close', { duration: 4000 });
    });
  });

  describe('UI Operations', () => {
    it('should toggle expand row', () => {
      component.expandedRowId = null;
      component.toggleExpand(mockData[0]);
      expect(component.expandedRowId).toBe('1');

      component.toggleExpand(mockData[0]);
      expect(component.expandedRowId).toBeNull();
    });

    it('should close form and reset state', () => {
      component.openCreateForm();
      expect(component.isFormExpanded).toBe(true);

      component.closeForm();
      expect(component.isFormExpanded).toBe(false);
      expect(component.editingId).toBeNull();
    });

    it('should remove fertilizer item from array', () => {
      component.openCreateForm();
      component.addFertilizerItem();
      const initialLength = component.fertilizerItems.length;

      if (initialLength > 1) {
        component.removeFertilizerItem(0);
        expect(component.fertilizerItems.length).toBe(initialLength - 1);
      }
    });

    it('should prevent removing last item', () => {
      component.openCreateForm();
      expect(component.fertilizerItems.length).toBe(1);
      component.removeFertilizerItem(0);
      expect(mockSnackBar.open).toHaveBeenCalledWith('At least one fertilizer item is required', 'Close', { duration: 3000 });
    });
  });
});
