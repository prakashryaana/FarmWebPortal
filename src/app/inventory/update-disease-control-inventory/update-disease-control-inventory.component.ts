import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CropFarmSelectorService } from '../../crop-farm-selector/crop-farm-selector.service';

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

  form = new FormGroup({
    inventoryId: new FormControl(''),
    diseaseControlName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    quantitySupplied: new FormControl(0.0, [Validators.required]),
    suppliedDate: new FormControl(null)
  });

  list: DiseaseControlInventory[] = [];
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

  selectForEdit(item: DiseaseControlInventory) {
    this.form.patchValue({
      inventoryId: item.inventoryId,
      diseaseControlName: item.diseaseControlName,
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

  delete(item: DiseaseControlInventory) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${item.diseaseControlName}"?`,
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
      diseaseControlName: this.form.get('diseaseControlName')?.value,
      farmId: this.selectedFarmId,
      quantitySupplied: parseFloat(Number(this.form.get('quantitySupplied')?.value || 0).toFixed(2)),
      suppliedDate: this.form.get('suppliedDate')?.value
    };
  }
}
