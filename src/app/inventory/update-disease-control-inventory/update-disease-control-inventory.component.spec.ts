import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateDiseaseControlInventoryComponent } from './update-disease-control-inventory.component';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FormArray } from '@angular/forms';

describe('UpdateDiseaseControlInventoryComponent', () => {
  let component: UpdateDiseaseControlInventoryComponent;
  let fixture: ComponentFixture<UpdateDiseaseControlInventoryComponent>;
  let mockService: jasmine.SpyObj<DiseaseControlInventoryService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockData: DiseaseControlInventory[] = [
    {
      inventoryId: '1',
      farmId: 'farm1',
      invoiceNumber: 'INV-001',
      supplier: 'Supplier A',
      suppliedDate: '2024-01-10T09:00:00Z',
      diseaseControlItems: [
        {
          diseaseControlName: 'BLITOX',
          quantitySupplied: 50.25,
          quantityMetric: 'Liters',
          quantityUsed: 20.00,
          usedDate: '2024-02-05T10:30:00Z'
        }
      ]
    },
    {
      inventoryId: '2',
      farmId: 'farm1',
      invoiceNumber: 'INV-002',
      supplier: 'Supplier B',
      suppliedDate: '2024-01-15T11:00:00Z',
      diseaseControlItems: [
        {
          diseaseControlName: 'SPINOSAD 45%',
          quantitySupplied: 75.50,
          quantityMetric: 'Liters',
          quantityUsed: 35.75,
          usedDate: '2024-02-20T14:00:00Z'
        }
      ]
    }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('DiseaseControlInventoryService', ['list', 'create', 'update', 'delete', 'getInputCatalogNames']);
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

    mockService.list.and.returnValue(of({ success: true, data: mockData }));
    mockService.getInputCatalogNames.and.returnValue(of(['BLITOX', 'SPINOSAD 45%']));
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
    expect(component.list[0].invoiceNumber).toBe('INV-001');
    expect(component.list[0].diseaseControlItems.length).toBe(1);
  });

  describe('Create Operations', () => {
    it('should open create form', () => {
      component.openCreateForm();
      expect(component.isFormExpanded).toBe(true);
      expect(component.editingId).toBeNull();
      expect(component.diseaseControlItems.length).toBe(1);
    });

    it('should add disease control item to form array', () => {
      component.openCreateForm();
      const initialLength = component.diseaseControlItems.length;
      component.addDiseaseControlItem();
      expect(component.diseaseControlItems.length).toBe(initialLength + 1);
    });

    it('should submit create with valid form', () => {
      mockService.create.and.returnValue(of({}));

      component.openCreateForm();
      component.form.patchValue({
        invoiceNumber: 'INV-003',
        supplier: 'Test Supplier',
        suppliedDate: new Date()
      });
      component.diseaseControlItems.at(0)?.patchValue({
        diseaseControlName: 'BLITOX',
        quantitySupplied: 100.00,
        quantityMetric: 'Liters'
      });

      component.submit();

      expect(mockService.create).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created successfully', 'Close', { duration: 3000 });
    });

    it('should not submit with invalid form', () => {
      component.openCreateForm();
      component.form.reset();
      const diseaseControlArray = component.form.get('diseaseControlItems') as FormArray;
      diseaseControlArray.clear();
      
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

    it('should remove disease control item from array', () => {
      component.openCreateForm();
      component.addDiseaseControlItem();
      const initialLength = component.diseaseControlItems.length;

      if (initialLength > 1) {
        component.removeDiseaseControlItem(0);
        expect(component.diseaseControlItems.length).toBe(initialLength - 1);
      }
    });

    it('should prevent removing last item', () => {
      component.openCreateForm();
      expect(component.diseaseControlItems.length).toBe(1);
      component.removeDiseaseControlItem(0);
      expect(mockSnackBar.open).toHaveBeenCalledWith('At least one disease control item is required', 'Close', { duration: 3000 });
    });
  });
});

  // describe('Delete Operations', () => {
  //   it('should delete item after confirmation', () => {
  //     mockService.delete.and.returnValue(of({}));
  //     const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
  //     mockDialogRef.afterClosed.and.returnValue(of(true));
  //     mockDialog.open.and.returnValue(mockDialogRef);

  //     component.delete(mockData[0]);

  //     expect(mockDialog.open).toHaveBeenCalled();
  //     expect(mockService.delete).toHaveBeenCalledWith('1');
  //     expect(mockSnackBar.open).toHaveBeenCalledWith('Deleted successfully', 'Close', { duration: 3000 });
  //   });

  //   it('should not delete if user cancels', () => {
  //     const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
  //     mockDialogRef.afterClosed.and.returnValue(of(false));
  //     mockDialog.open.and.returnValue(mockDialogRef);

  //     component.delete(mockData[0]);

  //     expect(mockService.delete).not.toHaveBeenCalled();
  //   });

  //   it('should show error on delete failure', () => {
  //     mockService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
  //     const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
  //     mockDialogRef.afterClosed.and.returnValue(of(true));
  //     mockDialog.open.and.returnValue(mockDialogRef);

  //     component.delete(mockData[0]);

  //     expect(mockSnackBar.open).toHaveBeenCalledWith('Delete failed', 'Close', { duration: 4000 });
  //   });
  // });

  // describe('Form Management', () => {
  //   it('should close form and reset', () => {
  //     component.isFormExpanded = true;
  //     component.editingId = '1';
  //     component.form.patchValue({ diseaseControlName: 'Test' });

  //     component.closeForm();

  //     expect(component.isFormExpanded).toBe(false);
  //     expect(component.editingId).toBeNull();
  //     expect(component.form.get('diseaseControlName')?.value).toBeNull();
  //   });

  //   it('should format quantity to 2 decimal places', () => {
  //     component.form.patchValue({
  //       diseaseControlName: 'Test Control',
  //       quantitySupplied: 100.555,
  //       quantityUsed: 50.444,
  //       suppliedDate: new Date(),
  //       usedDate: new Date()
  //     });

  //     const payload = (component as any).buildPayload();

  //     expect(payload.quantitySupplied).toBe(100.56);
  //     expect(payload.quantityUsed).toBe(50.44);
  //   });
  // });

  // describe('Data Refresh', () => {
  //   it('should reload list after create', () => {
  //     mockService.create.and.returnValue(of({}));
  //     mockService.list.calls.reset();
  //     mockService.list.and.returnValue(of(mockData));

  //     component.form.patchValue({
  //       diseaseControlName: 'New Control',
  //       quantitySupplied: 80.00,
  //       suppliedDate: new Date(),
  //       quantityUsed: 30.00,
  //       usedDate: new Date()
  //     });

  //     component.submit();

  //     expect(mockService.list).toHaveBeenCalled();
  //   });

  //   it('should reload list after delete', () => {
  //     mockService.delete.and.returnValue(of({}));
  //     mockService.list.calls.reset();
  //     mockService.list.and.returnValue(of(mockData));

  //     const mockDialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
  //     mockDialogRef.afterClosed.and.returnValue(of(true));
  //     mockDialog.open.and.returnValue(mockDialogRef);

  //     component.delete(mockData[0]);

  //     expect(mockService.list).toHaveBeenCalled();
  //   });
  // });
//});
