import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CropFarmSelectorService } from '../../crop-farm-selector/crop-farm-selector.service';
import { effect } from '@angular/core';

interface DiseaseControlInventoryItem {
  diseaseControlName: string;
  quantitySupplied: number;
  quantityMetric: string;
}

@Component({
  selector: 'app-update-disease-control-inventory',
  templateUrl: './update-disease-control-inventory.component.html',
  styleUrls: ['./update-disease-control-inventory.component.css'],
  imports: [ReactiveFormsModule, CommonModule, MatIconModule, MatButtonModule]
})
export class UpdateDiseaseControlInventoryComponent {
  private snackBar = inject(MatSnackBar);
  private svc = inject(DiseaseControlInventoryService);
  private confirmDialog = inject(MatDialog);
  private readonly cropFarmSelector = inject(CropFarmSelectorService);

  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }
  get selectedFarmId() { return this.cropFarmSelector.selectedFarmId(); }

  diseaseControlNames = [
    'Yellow Trap','Blue Trap','BLITOX','SPINOSAD 45%','NINJA','SJ ERASER','THRIPO','FUNIMAN',
    'BEAUVERIA BASSIANA','BIO INSECTICIDE'];
  
  quantityMetrics = ['Packets', 'Liters'];

  form = new FormGroup({
    inventoryId: new FormControl(''),
    suppliedDate: new FormControl(null),
    invoiceNumber: new FormControl('',[Validators.required]),
    supplier: new FormControl('',[Validators.required]),
    diseaseControlItems: new FormArray([], [Validators.required, Validators.minLength(1)])
  });

  list: DiseaseControlInventory[] = [];
  isFormExpanded = false;
  editingId: string | null = null;
  expandedRowId: string | null = null;

  constructor() { 
    effect(() => {
      this.load();
    });
  }

  get diseaseControlItems(): FormArray {
    return this.form.get('diseaseControlItems') as FormArray;
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
    this.form.setControl('diseaseControlItems', new FormArray([], [Validators.required, Validators.minLength(1)]));
    this.editingId = null;
    this.isFormExpanded = true;
    this.addDiseaseControlItem();
  }

  closeForm() {
    this.isFormExpanded = false;
    this.editingId = null;
    this.form.reset();
  }

  addDiseaseControlItem() {
    const itemForm = new FormGroup({
      diseaseControlName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      quantitySupplied: new FormControl(0.0, [Validators.required]),
      quantityMetric: new FormControl('Packets', [Validators.required])
    });
    this.diseaseControlItems.push(itemForm);
  }

  removeDiseaseControlItem(index: number) {
    if (this.diseaseControlItems.length > 1) {
      this.diseaseControlItems.removeAt(index);
    } else {
      this.snackBar.open('At least one disease control item is required', 'Close', { duration: 3000 });
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

  delete(item: DiseaseControlInventory) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete this disease control inventory entry?`,
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

  toggleExpand(item: DiseaseControlInventory) {
    this.expandedRowId = this.expandedRowId === item.inventoryId ? null : item.inventoryId || null;
  }

  private buildPayload() {
    return {
      farmId: this.selectedFarmId,
      suppliedDate: this.form.get('suppliedDate')?.value,
      invoiceNumber: this.form.get('invoiceNumber')?.value,
      supplier: this.form.get('supplier')?.value,
      diseaseControlItems: this.diseaseControlItems.value
    };
  }
}
