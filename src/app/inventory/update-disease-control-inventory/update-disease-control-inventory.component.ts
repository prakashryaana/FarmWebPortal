import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
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
import { AuthService } from '../../auth/auth.service';

export interface DiseaseControlSummary {
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

interface DiseaseControlInventoryItem {
  diseaseControlName: string;
  quantitySupplied: number;
  quantityMetric: string;
}

@Component({
  selector: 'app-update-disease-control-inventory',
  templateUrl: './update-disease-control-inventory.component.html',
  styleUrls: ['./update-disease-control-inventory.component.css'],
  imports: [ReactiveFormsModule, FormsModule, CommonModule, MatIconModule, MatButtonModule]
})
export class UpdateDiseaseControlInventoryComponent {
  private snackBar = inject(MatSnackBar);
  private svc = inject(DiseaseControlInventoryService);
  private confirmDialog = inject(MatDialog);
  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  get isAdmin() { return this.authService.hasRole('EASYGROWADMIN'); }

  showReportView = true;
  reportLoading = false;
  diseaseControlSummaries: DiseaseControlSummary[] = [];
  selectedDiseaseControl: DiseaseControlSummary | null = null;
  searchQuery = '';

  get filteredDiseaseControlSummaries() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return this.diseaseControlSummaries;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.diseaseControlSummaries.filter(s => s.name && s.name.toLowerCase().includes(query));
  }

  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }
  get selectedFarmId() { return this.cropFarmSelector.selectedFarmId(); }

  diseaseControlNames: string[] = [];
  
  quantityMetrics = ['Packets', 'Litres'];

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
    this.loadCatalogNames();
  }

  loadCatalogNames() {
    this.svc.getInputCatalogNames('DISEASE_CONTROL').subscribe({
      next: names => this.diseaseControlNames = names,
      error: e => console.error(e)
    });
  }

  get diseaseControlItems(): FormArray {
    return this.form.get('diseaseControlItems') as FormArray;
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
      this.diseaseControlSummaries = [];
      this.selectedDiseaseControl = null;
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

  toggleReportView() {
    this.showReportView = !this.showReportView;
    if (this.showReportView) {
      this.loadReportData();
    }
  }

  selectDiseaseControl(summary: DiseaseControlSummary) {
    this.selectedDiseaseControl = summary;
  }

  loadReportData() {
    if (!this.selectedFarmId) {
      this.diseaseControlSummaries = [];
      this.selectedDiseaseControl = null;
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
    
    this.diseaseControlNames.forEach(name => {
      if (name) uniqueNames.add(name);
    });

    this.list.forEach(inv => {
      inv.diseaseControlItems?.forEach(item => {
        if (item.diseaseControlName) {
          uniqueNames.add(item.diseaseControlName);
        }
      });
    });

    const summaries: DiseaseControlSummary[] = [];

    uniqueNames.forEach(name => {
      let totalSupplied = 0;
      let totalUsed = 0;
      let metric = 'Packets';
      const suppliesList: any[] = [];
      const usagesList: any[] = [];

      this.list.forEach(inv => {
        inv.diseaseControlItems?.forEach(item => {
          if (item.diseaseControlName && item.diseaseControlName.toLowerCase() === name.toLowerCase()) {
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

    this.diseaseControlSummaries = summaries.sort((a, b) => a.name.localeCompare(b.name));

    if (this.selectedDiseaseControl) {
      const match = this.diseaseControlSummaries.find(s => s.name === this.selectedDiseaseControl?.name);
      this.selectedDiseaseControl = match || (this.diseaseControlSummaries.length > 0 ? this.diseaseControlSummaries[0] : null);
    } else if (this.diseaseControlSummaries.length > 0) {
      this.selectedDiseaseControl = this.diseaseControlSummaries[0];
    } else {
      this.selectedDiseaseControl = null;
    }
  }
}
