import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CropMasterService, CropMaster } from './crop-master.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-crop-master',
  templateUrl: './update-crop-master.component.html',
  styleUrls: ['./update-crop-master.component.css'],
  imports: [ReactiveFormsModule, CommonModule, MatIconModule, MatButtonModule],
})
export class UpdateCropMasterComponent {
  private snackBar = inject(MatSnackBar);
  private service = inject(CropMasterService);
  private confirmDialog = inject(MatDialog);
  private router = inject(Router);

  showLanding = true;

  goToCropMaster() {
    this.showLanding = false;
  }

  goToFertilizerMaster() {
    this.router.navigate(['/fertilizer-master']);
  }

  goToDiseaseControlMaster() {
    this.router.navigate(['/disease-control-master']);
  }

  goBack() {
    this.showLanding = true;
  }

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
    sowingMethod: new FormControl('Rizomes/Seedlings', [Validators.required]),
    moleculesToAdd: new FormControl('', [Validators.maxLength(250)]),
    pestsAndDiseases: new FormControl('', [Validators.maxLength(250)])
  });

  list: CropMaster[] = [];
  isFormExpanded = false;
  editingId: string | null = null;
  displayColumns = ['cropName', 'duration', 'expectedYield', 'sowingMethod', 'harvestTime', 'actions'];

  constructor() {
    this.loadList();
  }

  loadList() {
    this.service.list().subscribe({
      next: (res) => this.list = res,
      error: (err) => console.error('Failed to load crop master list', err)
    });
  }

  openCreateForm() {
    this.form.reset({ sowingMethod: 'Rizomes/Seedlings' });
    this.editingId = null;
    this.isFormExpanded = true;
  }

  closeForm() {
    this.isFormExpanded = false;
    this.editingId = null;
    this.form.reset({ sowingMethod: 'Rizomes/Seedlings' });
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
    this.editingId = item.cropId || null;
    this.isFormExpanded = true;
  }

  submit() {
    if (!this.form.valid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    const payload = this.normalizedForm();
    
    if (this.editingId) {
      this.service.update(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Updated successfully', 'Close', { duration: 3000 });
          this.loadList();
          this.closeForm();
        },
        error: (e) => { console.error(e); this.snackBar.open('Update failed', 'Close', { duration: 4000 }); }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Created successfully', 'Close', { duration: 3000 });
          this.loadList();
          this.closeForm();
        },
        error: (e) => { console.error(e); this.snackBar.open('Create failed', 'Close', { duration: 4000 }); }
      });
    }
  }

  delete(item: CropMaster) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${item.cropName}"?`,
        action: 'Delete'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(item.cropId || '').subscribe({
        next: () => {
          this.snackBar.open('Deleted successfully', 'Close', { duration: 3000 });
          this.loadList();
        },
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
      sowingMethod: String(this.form.get('sowingMethod')?.value || 'Rizomes/Seedlings'),
      moleculesToAdd: String(this.form.get('moleculesToAdd')?.value || ''),
      pestsAndDiseases: String(this.form.get('pestsAndDiseases')?.value || '')
    };
  }
}

