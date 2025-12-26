import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CropMasterService, CropMaster } from './crop-master.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-update-crop-master',
  templateUrl: './update-crop-master.component.html',
  styleUrls: ['./update-crop-master.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class UpdateCropMasterComponent {
  private snackBar = inject(MatSnackBar);
  private service = inject(CropMasterService);
  private confirmDialog = inject(MatDialog)

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  form = new FormGroup({
    cropId: new FormControl(''),
    cropName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    duration: new FormControl(0, [Validators.required, Validators.min(0)]),
    expectedYield: new FormControl(0.0, [Validators.required]),
    sowingTimeFromMonth: new FormControl('', [Validators.required]),
    sowingTimeToMonth: new FormControl('', [Validators.required]),
    harvestTimeFromMonth: new FormControl('', [Validators.required]),
    harvestTimeToMonth: new FormControl('', [Validators.required]),
    sowingMethod: new FormControl('Seedlings', [Validators.required]),
    moleculesToAdd: new FormControl('', [Validators.maxLength(250)]),
    pestsAndDiseases: new FormControl('', [Validators.maxLength(250)])
  });

  list: CropMaster[] = [];

  constructor() {
    this.loadList();
  }

  loadList() {
    this.service.list().subscribe({
      next: (res) => this.list = res,
      error: (err) => console.error('Failed to load crop master list', err)
    });
  }

  selectForEdit(item: CropMaster) {
    const parseMonthRange = (range: string) => {
      const parts = range?.split('-') || [];
      return { from: parts[0]?.trim() || '', to: parts[1]?.trim() || '' };
    };
    
    const sowing = parseMonthRange(item.sowingTime);
    const harvest = parseMonthRange(item.harvestTime);
    
    this.form.patchValue({
      cropId: item.cropId,
      cropName: item.cropName,
      duration: item.duration,
      expectedYield: item.expectedYield,
      sowingTimeFromMonth: sowing.from,
      sowingTimeToMonth: sowing.to,
      harvestTimeFromMonth: harvest.from,
      harvestTimeToMonth: harvest.to,
      sowingMethod: item.sowingMethod,
      moleculesToAdd: item.moleculesToAdd,
      pestsAndDiseases: item.pestsAndDiseases
    });
  }

  create() {
    if (this.form.valid) {
      const payload: CropMaster = this.normalizedForm();
      this.service.create(payload).subscribe({
        next: () => { this.snackBar.open('Created', 'Close', { duration: 3000 }); this.loadList(); this.form.reset(); },
        error: (e) => { console.error(e); this.snackBar.open('Create failed', 'Close', { duration: 4000 }); }
      });
    }
  }

  update() {
    const cropId = this.form.get('cropId')?.value;
    if (!cropId) { this.snackBar.open('Select an item to update', 'Close', { duration: 3000 }); return; }
    if (this.form.valid) {
      const payload: CropMaster = this.normalizedForm();
      this.service.update(cropId, payload).subscribe({
        next: () => { this.snackBar.open('Updated', 'Close', { duration: 3000 }); this.loadList(); this.form.reset(); },
        error: (e) => { console.error(e); this.snackBar.open('Update failed', 'Close', { duration: 4000 }); }
      });
    }
  }

  delete() {
    const cropId = this.form.get('cropId')?.value;
    if (!cropId) { this.snackBar.open('Select an item to delete', 'Close', { duration: 3000 }); return; }

    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { 
          title: 'Confirm Deletion',
          message: `Are you sure you want to delete "${this.form.get('cropName')?.value}"?`,
          action: 'Delete'
          }
        });
    
    dialogRef.afterClosed()
    .subscribe(confirmed => {
      if (!confirmed) return;  // User cancelled

      this.service.delete(cropId).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadList(); this.form.reset(); },
        error: (e) => { console.error(e); this.snackBar.open('Delete failed', 'Close', { duration: 4000 }); }
      });
    });
  }

  private normalizedForm(): CropMaster {
    const sowingFrom = String(this.form.get('sowingTimeFromMonth')?.value || '');
    const sowingTo = String(this.form.get('sowingTimeToMonth')?.value || '');
    const harvestFrom = String(this.form.get('harvestTimeFromMonth')?.value || '');
    const harvestTo = String(this.form.get('harvestTimeToMonth')?.value || '');

    return {
      cropId: String(this.form.get('cropId')?.value),
      cropName: String(this.form.get('cropName')?.value || ''),
      duration: Number(this.form.get('duration')?.value || 0),
      expectedYield: parseFloat(Number(this.form.get('expectedYield')?.value || 0).toFixed(2)),
      sowingTime: `${sowingFrom}-${sowingTo}`,
      harvestTime: `${harvestFrom}-${harvestTo}`,
      sowingMethod: String(this.form.get('sowingMethod')?.value || 'Seedlings'),
      moleculesToAdd: String(this.form.get('moleculesToAdd')?.value || ''),
      pestsAndDiseases: String(this.form.get('pestsAndDiseases')?.value || '')
    };
  }
}
