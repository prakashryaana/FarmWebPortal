import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
import { InputCatalogItem } from '../update-fertilizer-inventory/fertilizer-inventory.service';
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  showGenerateReportView = false;
  reportStartDate = '';
  reportEndDate = '';
  useDateFilter = false;
  generatedReportData: any[] = [];
  generatedReportLoading = false;
  earliestGeneratedDate: Date | null = null;

  get reportDisplayStartDate(): Date {
    if (this.useDateFilter && this.reportStartDate) {
      return new Date(this.reportStartDate);
    }
    return this.earliestGeneratedDate || new Date();
  }

  get reportDisplayEndDate(): Date {
    if (this.useDateFilter && this.reportEndDate) {
      return new Date(this.reportEndDate);
    }
    return new Date(); // Today's date
  }

  get filteredDiseaseControlSummaries() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return this.diseaseControlSummaries;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.diseaseControlSummaries.filter(s => s.name && s.name.toLowerCase().includes(query));
  }

  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }
  get selectedFarmId() { return this.cropFarmSelector.selectedFarmId(); }
  get selectedCropName() { return this.cropFarmSelector.selectedCropName(); }

  diseaseControlCatalog: InputCatalogItem[] = [];
  diseaseControlNames: string[] = [];

  quantityMetrics = ['kg', 'grams', 'litres', 'mililitres', 'packets', 'bottles', 'numbers'];

  form = new FormGroup({
    inventoryId: new FormControl(''),
    suppliedDate: new FormControl(null),
    invoiceNumber: new FormControl('', [Validators.required]),
    supplier: new FormControl('', [Validators.required]),
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
      next: (items: any) => {
        const rawItems = items || [];
        this.diseaseControlCatalog = rawItems.map((x: any) => typeof x === 'string' ? { name: x } : x);
        this.diseaseControlNames = this.diseaseControlCatalog.map(x => x.name);

        // Ensure all displayUnit or unitType from catalog items are present in quantityMetrics
        this.diseaseControlCatalog.forEach(item => {
          const unit = item.displayUnit || item.unitType;
          if (unit && !this.quantityMetrics.some(m => m.toLowerCase() === unit.toLowerCase())) {
            this.quantityMetrics.push(unit);
          }
        });

        // Update metric for any items already in the form array
        this.diseaseControlItems.controls.forEach(ctrl => {
          const itemForm = ctrl as FormGroup;
          const name = itemForm.get('diseaseControlName')?.value;
          if (name) {
            this.updateMetricForDiseaseControl(itemForm, name);
          }
        });
      },
      error: e => console.error(e)
    });
  }

  get diseaseControlItems(): FormArray {
    return this.form.get('diseaseControlItems') as FormArray;
  }

  load() {
    if (this.selectedFarmId) {
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
          if (this.showGenerateReportView) {
            this.generateReport();
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
    this.showGenerateReportView = false;
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
      quantityMetric: new FormControl({ value: 'Packets', disabled: true }, [Validators.required])
    });

    itemForm.get('diseaseControlName')?.valueChanges.subscribe(name => {
      this.updateMetricForDiseaseControl(itemForm, name);
    });

    this.diseaseControlItems.push(itemForm);
  }

  onDiseaseControlNameChange(index: number) {
    const itemForm = this.diseaseControlItems.at(index) as FormGroup;
    if (!itemForm) return;
    const selectedName = itemForm.get('diseaseControlName')?.value;
    this.updateMetricForDiseaseControl(itemForm, selectedName);
  }

  updateMetricForDiseaseControl(itemForm: FormGroup, diseaseControlName: string | null | undefined) {
    if (!diseaseControlName) return;
    const match = this.diseaseControlCatalog.find(
      x => x.name?.trim().toLowerCase() === diseaseControlName.trim().toLowerCase()
    );
    const targetUnit = match?.displayUnit || match?.unitType;
    if (targetUnit) {
      const exactMatch = this.quantityMetrics.find(m => m === targetUnit);
      const matchedMetric = exactMatch || this.quantityMetrics.find(m => m.toLowerCase() === targetUnit.toLowerCase());

      if (matchedMetric) {
        itemForm.get('quantityMetric')?.setValue(matchedMetric);
      } else {
        this.quantityMetrics.push(targetUnit);
        itemForm.get('quantityMetric')?.setValue(targetUnit);
      }
    }
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
        message: `Do you want to delete this entry?\nThis action cannot be undone!`,
        action: 'Delete',
        isRed: true
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
      diseaseControlItems: this.diseaseControlItems.getRawValue()
    };
  }

  toggleReportView() {
    this.showGenerateReportView = false;
    this.showReportView = !this.showReportView;
    if (this.showReportView) {
      this.loadReportData();
    }
  }

  openGenerateReportView() {
    this.showGenerateReportView = true;
    this.showReportView = false;
    this.isFormExpanded = false;
    this.generatedReportData = [];
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

      if (totalSupplied > 0) {
        summaries.push({
          name,
          totalSupplied,
          totalUsed,
          remaining,
          metric,
          supplies: suppliesList,
          usages: usagesList
        });
      }
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

  get generatedReportTotalSupplied(): number {
    return this.generatedReportData.reduce((sum, item) => sum + (item.totalSupplied || 0), 0);
  }

  get generatedReportTotalUsed(): number {
    return this.generatedReportData.reduce((sum, item) => sum + (item.totalUsed || 0), 0);
  }

  get generatedReportTotalRemaining(): number {
    return this.generatedReportData.reduce((sum, item) => sum + (item.remaining || 0), 0);
  }

  generateReport() {
    if (!this.selectedFarmId) {
      this.generatedReportData = [];
      return;
    }

    this.generatedReportLoading = true;
    this.cropFarmSelector.getCropFarmForUser().subscribe({
      next: allOptions => {
        const farmCrops = allOptions.filter(opt => opt.farmId === this.selectedFarmId);
        const cropMap: { [id: string]: string } = {};
        farmCrops.forEach(c => cropMap[c.cropId] = c.cropName);
        const cropIds = farmCrops.map(c => c.cropId).filter(id => id && id !== 'NA');

        if (cropIds.length === 0) {
          this.processGeneratedReportData([], cropMap);
          this.generatedReportLoading = false;
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
            this.processGeneratedReportData(flattenedActivities, cropMap);
            this.generatedReportLoading = false;
          },
          error: err => {
            console.error('Error fetching activities:', err);
            this.processGeneratedReportData([], cropMap);
            this.generatedReportLoading = false;
          }
        });
      },
      error: err => {
        console.error('Error fetching crops:', err);
        this.generatedReportLoading = false;
      }
    });
  }

  private processGeneratedReportData(activities: Activity[], cropMap: { [id: string]: string }) {
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

    const summaries: any[] = [];

    // Find the earliest date in records
    let earliestMs = Infinity;
    this.list.forEach(inv => {
      if (inv.suppliedDate) {
        const ms = new Date(inv.suppliedDate).getTime();
        if (ms < earliestMs) earliestMs = ms;
      }
    });
    activities.forEach(act => {
      if (act.createdAt) {
        const ms = new Date(act.createdAt).getTime();
        if (ms < earliestMs) earliestMs = ms;
      }
    });
    this.earliestGeneratedDate = earliestMs !== Infinity ? new Date(earliestMs) : null;

    // Parse filter dates
    let startMs = 0;
    let endMs = Infinity;
    if (this.useDateFilter) {
      if (this.reportStartDate) {
        startMs = new Date(this.reportStartDate).getTime();
      }
      if (this.reportEndDate) {
        const d = new Date(this.reportEndDate);
        d.setHours(23, 59, 59, 999);
        endMs = d.getTime();
      }
    }

    uniqueNames.forEach(name => {
      let totalSupplied = 0;
      let totalUsed = 0;
      let metric = 'Packets';

      this.list.forEach(inv => {
        if (this.useDateFilter) {
          const sDate = inv.suppliedDate ? new Date(inv.suppliedDate).getTime() : 0;
          if (sDate < startMs || sDate > endMs) {
            return;
          }
        }

        inv.diseaseControlItems?.forEach(item => {
          if (item.diseaseControlName && item.diseaseControlName.toLowerCase() === name.toLowerCase()) {
            totalSupplied += item.quantitySupplied;
            totalUsed += (item.quantityUsed || 0);
            metric = item.quantityMetric || metric;
          }
        });
      });

      activities.forEach(act => {
        if (this.useDateFilter) {
          const actDate = act.createdAt ? new Date(act.createdAt).getTime() : 0;
          if (actDate < startMs || actDate > endMs) {
            return;
          }
        }

        if (act.productName && act.productName.trim().toLowerCase() === name.trim().toLowerCase()) {
          const qty = typeof act.quantity === 'number' ? act.quantity : parseFloat(act.quantity || '0');
          totalUsed += qty;
        }
      });

      const remaining = Math.max(0, totalSupplied - totalUsed);

      if (totalSupplied > 0) {
        summaries.push({
          name,
          totalSupplied,
          totalUsed,
          remaining,
          metric
        });
      }
    });

    this.generatedReportData = summaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  exportExcel() {
    if (this.generatedReportData.length === 0) return;

    const data = this.generatedReportData.map(item => ({
      'Disease Control Name': item.name,
      'Total Supplied (Packets/Litres)': item.totalSupplied,
      'Total Used (Packets/Litres)': item.totalUsed,
      'Remaining Stock (Packets/Litres)': item.remaining
    }));

    data.push({
      'Disease Control Name': 'Total',
      'Total Supplied (Packets/Litres)': this.generatedReportTotalSupplied,
      'Total Used (Packets/Litres)': this.generatedReportTotalUsed,
      'Remaining Stock (Packets/Litres)': this.generatedReportTotalRemaining
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Disease Control Stock Report');

    const farmName = (this.selectedFarmName || 'farm').replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Disease_Control_Report_${farmName}.xlsx`);
  }

  exportPdf() {
    if (this.generatedReportData.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Disease Control Usage & Stock Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Farm Name: ${this.selectedFarmName || '-'}`, 14, 28);
    if (this.selectedCropName) {
      doc.text(`Crop Name: ${this.selectedCropName}`, 14, 34);
    }

    const start = this.reportDisplayStartDate ? new Date(this.reportDisplayStartDate).toLocaleDateString('en-GB') : 'All Time';
    const end = this.reportDisplayEndDate ? new Date(this.reportDisplayEndDate).toLocaleDateString('en-GB') : 'All Time';
    doc.text(`Date Range: ${start} to ${end}`, 14, 40);

    const headers = [['Disease Control Name', 'Total Supplied (Packets/Litres)', 'Total Used (Packets/Litres)', 'Remaining Stock (Packets/Litres)']];
    const body = this.generatedReportData.map(item => [
      item.name,
      item.totalSupplied,
      item.totalUsed,
      item.remaining
    ]);

    body.push([
      'Total',
      this.generatedReportTotalSupplied,
      this.generatedReportTotalUsed,
      this.generatedReportTotalRemaining
    ]);

    autoTable(doc, {
      startY: 46,
      head: headers,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [0, 150, 136] },
      styles: { fontSize: 9 }
    });

    const farmName = (this.selectedFarmName || 'farm').replace(/\s+/g, '_');
    doc.save(`Disease_Control_Report_${farmName}.pdf`);
  }
}
