import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { FertilizerInventoryService, FertilizerInventory } from './fertilizer-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CropFarmSelectorService } from '../../crop-farm-selector/crop-farm-selector.service';
import { effect } from '@angular/core';

interface FertilizerInventoryItem {
  fertilizerName: string;
  quantitySupplied: number;
  quantityMetric: string;
}

@Component({
  selector: 'app-update-fertilizer-inventory',
  templateUrl: './update-fertilizer-inventory.component.html',
  styleUrls: ['./update-fertilizer-inventory.component.css'],
  imports: [ReactiveFormsModule, CommonModule, MatIconModule, MatButtonModule]
})
export class UpdateFertilizerInventoryComponent {
  private snackBar = inject(MatSnackBar);
  private svc = inject(FertilizerInventoryService);
  private confirmDialog = inject(MatDialog);
  private readonly cropFarmSelector = inject(CropFarmSelectorService);

  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }
  get selectedFarmId() { return this.cropFarmSelector.selectedFarmId(); }

  fertilizerNames = [
    'A1','A2','A3','A4','A5','B11','BF','C6','Drip Saff','CA','CHA','CSW','Trichoderma',
    'Pseudomonas','Bio Ferlilizer','VAM','FERT 1','FERT 2','FERT 3','FERT 4','Adjuvent'];
  
  quantityMetrics = ['Packets', 'Litres'];

  form = new FormGroup({
    inventoryId: new FormControl(''),
    suppliedDate: new FormControl(null),
    invoiceNumber: new FormControl('',[Validators.required]),
    supplier: new FormControl('',[Validators.required]),
    fertilizerItems: new FormArray([], [Validators.required, Validators.minLength(1)])
  });

  list: FertilizerInventory[] = [];
  isFormExpanded = false;
  editingId: string | null = null;
  expandedRowId: string | null = null;

  constructor() { 
    effect(() => {
      this.load();
    });
  }

  get fertilizerItems(): FormArray {
    return this.form.get('fertilizerItems') as FormArray;
  }

  load() { 
    if(this.selectedFarmId){
      this.svc.list(this.selectedFarmId).subscribe({ 
      next: r => this.list = r.data, 
      error: e => console.error(e) 
    }); 
    } else {
      this.list = [];
    }
  }

  openCreateForm() {
    this.form.reset();
    this.form.setControl('fertilizerItems', new FormArray([], [Validators.required, Validators.minLength(1)]));
    this.editingId = null;
    this.isFormExpanded = true;
    this.addFertilizerItem();
  }

  closeForm() {
    this.isFormExpanded = false;
    this.editingId = null;
    this.form.reset();
  }

  addFertilizerItem() {
    const itemForm = new FormGroup({
      fertilizerName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      quantitySupplied: new FormControl(0.0, [Validators.required]),
      quantityMetric: new FormControl('Packets', [Validators.required])
    });
    this.fertilizerItems.push(itemForm);
  }

  removeFertilizerItem(index: number) {
    if (this.fertilizerItems.length > 1) {
      this.fertilizerItems.removeAt(index);
    } else {
      this.snackBar.open('At least one fertilizer item is required', 'Close', { duration: 3000 });
    }
  }

  submit() {
    if (!this.form.valid || !this.selectedFarmId) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    const payload = this.buildPayload();

    if (this.editingId) {
      this.svc.update(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Updated successfully', 'Close', { duration: 3000 });
          this.load();
          this.closeForm();
        },
        error: (e) => { console.error(e); this.snackBar.open('Update failed', 'Close', { duration: 4000 }); }
      });
    } else {
      this.svc.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Created successfully', 'Close', { duration: 3000 });
          this.load();
          this.closeForm();
        },
        error: (e) => { console.error(e); this.snackBar.open('Create failed', 'Close', { duration: 4000 }); }
      });
    }
  }

  delete(item: FertilizerInventory) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete this fertilizer inventory entry?`,
        action: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.delete(item.inventoryId || '').subscribe({
        next: () => {
          this.snackBar.open('Deleted successfully', 'Close', { duration: 3000 });
          this.load();
        },
        error: (e) => { console.error(e); this.snackBar.open('Delete failed', 'Close', { duration: 4000 }); }
      });
    });
  }

  toggleExpand(item: FertilizerInventory) {
    this.expandedRowId = this.expandedRowId === item.inventoryId ? null : item.inventoryId || null;
  }

  private buildPayload() {
    return {
      farmId: this.selectedFarmId,
      suppliedDate: this.form.get('suppliedDate')?.value,
      invoiceNumber: this.form.get('invoiceNumber')?.value,
      supplier: this.form.get('supplier')?.value,
      fertilizerItems: this.fertilizerItems.value
    };
  }
}

