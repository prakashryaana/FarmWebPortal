import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FertilizerInventoryService, FertilizerInventory } from './fertilizer-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CropFarmSelectorService } from '../../crop-farm-selector/crop-farm-selector.service';

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

  form = new FormGroup({
    inventoryId: new FormControl(''),
    fertilizerName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    quantitySupplied: new FormControl(0.0, [Validators.required]),
    suppliedDate: new FormControl(null)
  });

  list: FertilizerInventory[] = [];
  isFormExpanded = false;
  editingId: string | null = null;

  constructor() { this.load(); }

  load() { 
    if(this.selectedFarmId){
      this.svc.list(this.selectedFarmId).subscribe({ 
      next: r => this.list = r, 
      error: e => console.error(e) 
    }); 
    }
  }

  openCreateForm() {
    this.form.reset();
    this.editingId = null;
    this.isFormExpanded = true;
  }

  closeForm() {
    this.isFormExpanded = false;
    this.editingId = null;
    this.form.reset();
  }

  selectForEdit(item: FertilizerInventory) {
    this.form.patchValue({
      inventoryId: item.inventoryId,
      fertilizerName: item.fertilizerName,
      quantitySupplied: item.quantitySupplied,
      suppliedDate: item.suppliedDate ? new Date(item.suppliedDate) : null
    });
    this.editingId = item.inventoryId || null;
    this.isFormExpanded = true;
  }

  submit() {
    if (!this.form.valid) {
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
        message: `Are you sure you want to delete "${item.fertilizerName}"?`,
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

  private buildPayload() {
    return {
      fertilizerName: this.form.get('fertilizerName')?.value,
      farmId: this.selectedFarmId,
      quantitySupplied: parseFloat(Number(this.form.get('quantitySupplied')?.value || 0).toFixed(2)),
      suppliedDate: this.form.get('suppliedDate')?.value
    };
  }
}

