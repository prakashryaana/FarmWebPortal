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
import { ActivityService, Activity } from '../../actions/view-actions/list-activity/activity.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface FertilizerInventoryItem {
  fertilizerName: string;
  quantitySupplied: number;
  quantityMetric: string;
}

export interface FertilizerSummary {
  name: string;
  totalSupplied: number;
  totalUsed: number;
  remaining: number;
  metric: string;
  supplies: {
    date?: string;
    invoiceNumber: string;
    supplier: string;
    quantitySupplied: number;
    quantityMetric: string;
  }[];
  usages: {
    date: string;
    cropName: string;
    activityType: string;
    quantityUsed: number;
    message: string;
  }[];
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
  private activityService = inject(ActivityService);

  showReportView = false;
  reportLoading = false;
  fertilizerSummaries: FertilizerSummary[] = [];
  selectedFertilizer: FertilizerSummary | null = null;

  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }
  get selectedFarmId() { return this.cropFarmSelector.selectedFarmId(); }

  fertilizerNames: string[] = [];
  
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

  isCatalogFormExpanded = false;

  catalogForm = new FormGroup({
    type: new FormControl('', [Validators.required]),
    customType: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.maxLength(100)])
  });

  constructor() { 
    effect(() => {
      this.load();
    });
    this.loadCatalogNames();
  }

  loadCatalogNames() {
    this.svc.getInputCatalogNames('FERTILIZER').subscribe({
      next: names => this.fertilizerNames = names,
      error: e => console.error(e)
    });
  }

  get fertilizerItems(): FormArray {
    return this.form.get('fertilizerItems') as FormArray;
  }

  load() { 
    if(this.selectedFarmId){
      this.svc.list(this.selectedFarmId).subscribe({ 
      next: r => {
        this.list = (r.data || []).sort((a, b) => {
          const dateA = a.suppliedDate ? new Date(a.suppliedDate).getTime() : 0;
          const dateB = b.suppliedDate ? new Date(b.suppliedDate).getTime() : 0;
          return dateB - dateA;
        });
        if (this.showReportView) {
          this.loadReportData();
        }
      }, 
      error: e => console.error(e) 
    }); 
    } else {
      this.list = [];
      this.fertilizerSummaries = [];
      this.selectedFertilizer = null;
    }
  }

  openCreateForm() {
    this.closeCatalogForm();
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

  openCatalogForm() {
    this.closeForm();
    this.catalogForm.reset({
      type: '',
      customType: '',
      name: ''
    });
    this.catalogForm.get('customType')?.clearValidators();
    this.catalogForm.get('customType')?.updateValueAndValidity();
    this.isCatalogFormExpanded = true;
  }

  closeCatalogForm() {
    this.isCatalogFormExpanded = false;
    this.catalogForm.reset();
  }

  onCatalogTypeChange() {
    const typeCtrl = this.catalogForm.get('type');
    const customTypeCtrl = this.catalogForm.get('customType');
    if (typeCtrl?.value === 'OTHERS') {
      customTypeCtrl?.setValidators([Validators.required, Validators.maxLength(100)]);
    } else {
      customTypeCtrl?.clearValidators();
      customTypeCtrl?.setValue('');
    }
    customTypeCtrl?.updateValueAndValidity();
  }

  submitCatalog() {
    if (!this.catalogForm.valid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    const typeValue = this.catalogForm.get('type')?.value;
    const customTypeValue = this.catalogForm.get('customType')?.value;
    const nameValue = this.catalogForm.get('name')?.value;

    const payload = {
      type: typeValue === 'OTHERS' ? customTypeValue : typeValue,
      name: nameValue
    } as any;

    this.svc.createInputCatalog(payload).subscribe({
      next: () => {
        this.snackBar.open('Catalog created successfully', 'Close', { duration: 3000 });
        this.closeCatalogForm();
        this.loadCatalogNames();
      },
      error: (e) => {
        console.error(e);
        this.snackBar.open('Failed to create catalog', 'Close', { duration: 4000 });
      }
    });
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
          this.snackBar.open('Updated successfully', 'Close', { 
            duration: 5000,
            panelClass: ['centered-success-snackbar']
          });
          this.load();
          this.closeForm();
        },
        error: (e) => { console.error(e); this.snackBar.open('Update failed', 'Close', { duration: 4000 }); }
      });
    } else {
      this.svc.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Created successfully', 'Close', { 
            duration: 5000,
            panelClass: ['centered-success-snackbar']
          });
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
          this.snackBar.open('Deleted successfully', 'Close', { 
            duration: 5000,
            panelClass: ['centered-success-snackbar']
          });
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

  toggleReportView() {
    this.showReportView = !this.showReportView;
    if (this.showReportView) {
      this.loadReportData();
    }
  }

  selectFertilizer(summary: FertilizerSummary) {
    this.selectedFertilizer = summary;
  }

  loadReportData() {
    if (!this.selectedFarmId) {
      this.fertilizerSummaries = [];
      this.selectedFertilizer = null;
      return;
    }

    this.reportLoading = true;
    this.cropFarmSelector.getCropFarmForUser().subscribe({
      next: allOptions => {
        const farmCrops = allOptions.filter(opt => opt.farmId === this.selectedFarmId);
        const cropMap: { [id: string]: string } = {};
        farmCrops.forEach(c => cropMap[c.cropId] = c.cropName);
        const cropIds = farmCrops.map(c => c.cropId).filter(id => id && id !== 'NA');

        if (cropIds.length === 0) {
          this.processReportData([], cropMap);
          this.reportLoading = false;
          return;
        }

        const activityRequests = cropIds.map(id => 
          this.activityService.getByCrop(id).pipe(
            catchError(err => {
              console.error(`Error loading activities for crop ${id}:`, err);
              return of([]);
            })
          )
        );

        forkJoin(activityRequests).subscribe({
          next: (results: Activity[][]) => {
            const flattenedActivities = results.reduce((acc, curr) => acc.concat(curr), []);
            this.processReportData(flattenedActivities, cropMap);
            this.reportLoading = false;
          },
          error: err => {
            console.error('Error fetching activities:', err);
            this.processReportData([], cropMap);
            this.reportLoading = false;
          }
        });
      },
      error: err => {
        console.error('Error fetching crops:', err);
        this.reportLoading = false;
      }
    });
  }

  private processReportData(activities: Activity[], cropMap: { [id: string]: string }) {
    const uniqueNames = new Set<string>();
    
    this.fertilizerNames.forEach(name => {
      if (name) uniqueNames.add(name);
    });

    this.list.forEach(inv => {
      inv.fertilizerItems?.forEach(item => {
        if (item.fertilizerName) {
          uniqueNames.add(item.fertilizerName);
        }
      });
    });

    const summaries: FertilizerSummary[] = [];

    uniqueNames.forEach(name => {
      let totalSupplied = 0;
      let totalUsed = 0;
      let metric = 'Packets';
      const suppliesList: any[] = [];
      const usagesList: any[] = [];

      this.list.forEach(inv => {
        inv.fertilizerItems?.forEach(item => {
          if (item.fertilizerName && item.fertilizerName.toLowerCase() === name.toLowerCase()) {
            totalSupplied += item.quantitySupplied;
            totalUsed += (item.quantityUsed || 0);
            metric = item.quantityMetric || metric;
            
            suppliesList.push({
              date: inv.suppliedDate,
              invoiceNumber: inv.invoiceNumber,
              supplier: inv.supplier,
              quantitySupplied: item.quantitySupplied,
              quantityMetric: item.quantityMetric
            });
          }
        });
      });

      activities.forEach(act => {
        if (act.productName && act.productName.trim().toLowerCase() === name.trim().toLowerCase()) {
          const qty = typeof act.quantity === 'number' ? act.quantity : parseFloat(act.quantity || '0');
          usagesList.push({
            date: act.createdAt,
            cropName: cropMap[act.cropId] || act.cropId || 'Unknown Crop',
            activityType: act.activityType,
            quantityUsed: qty,
            message: act.message
          });
        }
      });

      suppliesList.sort((a, b) => {
        const dA = a.date ? new Date(a.date).getTime() : 0;
        const dB = b.date ? new Date(b.date).getTime() : 0;
        return dB - dA;
      });

      usagesList.sort((a, b) => {
        const dA = a.date ? new Date(a.date).getTime() : 0;
        const dB = b.date ? new Date(b.date).getTime() : 0;
        return dB - dA;
      });

      const remaining = Math.max(0, totalSupplied - totalUsed);

      summaries.push({
        name,
        totalSupplied,
        totalUsed,
        remaining,
        metric,
        supplies: suppliesList,
        usages: usagesList
      });
    });

    this.fertilizerSummaries = summaries.sort((a, b) => a.name.localeCompare(b.name));

    if (this.selectedFertilizer) {
      const match = this.fertilizerSummaries.find(s => s.name === this.selectedFertilizer?.name);
      this.selectedFertilizer = match || (this.fertilizerSummaries.length > 0 ? this.fertilizerSummaries[0] : null);
    } else if (this.fertilizerSummaries.length > 0) {
      this.selectedFertilizer = this.fertilizerSummaries[0];
    } else {
      this.selectedFertilizer = null;
    }
  }
}

