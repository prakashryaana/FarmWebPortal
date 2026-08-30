import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FertilizerInventoryService, FertilizerInventory, InputCatalogItem } from './fertilizer-inventory.service';
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
  imports: [ReactiveFormsModule, FormsModule, CommonModule, MatIconModule, MatButtonModule]
})
export class UpdateFertilizerInventoryComponent {
  private snackBar = inject(MatSnackBar);
  private svc = inject(FertilizerInventoryService);
  private confirmDialog = inject(MatDialog);
  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);

  get isAdmin() { return this.authService.hasRole('EASYGROWADMIN'); }

  showReportView = true;
  reportLoading = false;
  fertilizerSummaries: FertilizerSummary[] = [];
  selectedFertilizer: FertilizerSummary | null = null;
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

  get filteredFertilizerSummaries() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return this.fertilizerSummaries;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.fertilizerSummaries.filter(s => s.name && s.name.toLowerCase().includes(query));
  }

  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }
  get selectedFarmId() { return this.cropFarmSelector.selectedFarmId(); }
  get selectedCropName() { return this.cropFarmSelector.selectedCropName(); }

  fertilizerCatalog: InputCatalogItem[] = [];
  fertilizerNames: string[] = [];

  quantityMetrics = ['kg', 'grams', 'litres', 'mililitres', 'packets', 'bottles'];

  form = new FormGroup({
    inventoryId: new FormControl(''),
    suppliedDate: new FormControl(null),
    invoiceNumber: new FormControl('', [Validators.required]),
    supplier: new FormControl('', [Validators.required]),
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
      next: (items: any) => {
        const rawItems = items || [];
        this.fertilizerCatalog = rawItems.map((x: any) => typeof x === 'string' ? { name: x } : x);
        this.fertilizerNames = this.fertilizerCatalog.map(x => x.name);

        // Ensure all displayUnit or unitType from catalog items are present in quantityMetrics
        this.fertilizerCatalog.forEach(item => {
          const unit = item.displayUnit || item.unitType;
          if (unit && !this.quantityMetrics.some(m => m.toLowerCase() === unit.toLowerCase())) {
            this.quantityMetrics.push(unit);
          }
        });

        // Update metric for any items already in the form array
        this.fertilizerItems.controls.forEach(ctrl => {
          const itemForm = ctrl as FormGroup;
          const fertName = itemForm.get('fertilizerName')?.value;
          if (fertName) {
            this.updateMetricForFertilizer(itemForm, fertName);
          }
        });
      },
      error: e => console.error(e)
    });
  }

  get fertilizerItems(): FormArray {
    return this.form.get('fertilizerItems') as FormArray;
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
      this.fertilizerSummaries = [];
      this.selectedFertilizer = null;
    }
  }

  openCreateForm() {
    this.closeCatalogForm();
    this.showGenerateReportView = false;
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
    this.showGenerateReportView = false;
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
      quantityMetric: new FormControl({ value: 'Packets', disabled: true }, [Validators.required])
    });

    itemForm.get('fertilizerName')?.valueChanges.subscribe(name => {
      this.updateMetricForFertilizer(itemForm, name);
    });

    this.fertilizerItems.push(itemForm);
  }

  onFertilizerNameChange(index: number) {
    const itemForm = this.fertilizerItems.at(index) as FormGroup;
    if (!itemForm) return;
    const selectedName = itemForm.get('fertilizerName')?.value;
    this.updateMetricForFertilizer(itemForm, selectedName);
  }

  updateMetricForFertilizer(itemForm: FormGroup, fertilizerName: string | null | undefined) {
    if (!fertilizerName) return;
    const match = this.fertilizerCatalog.find(
      x => x.name?.trim().toLowerCase() === fertilizerName.trim().toLowerCase()
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

  toggleExpand(item: FertilizerInventory) {
    this.expandedRowId = this.expandedRowId === item.inventoryId ? null : item.inventoryId || null;
  }

  private buildPayload() {
    return {
      farmId: this.selectedFarmId,
      suppliedDate: this.form.get('suppliedDate')?.value,
      invoiceNumber: this.form.get('invoiceNumber')?.value,
      supplier: this.form.get('supplier')?.value,
      fertilizerItems: this.fertilizerItems.getRawValue()
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
    this.isCatalogFormExpanded = false;
    this.generatedReportData = [];
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
        // Filter supply date if filter active
        if (this.useDateFilter) {
          const sDate = inv.suppliedDate ? new Date(inv.suppliedDate).getTime() : 0;
          if (sDate < startMs || sDate > endMs) {
            return;
          }
        }

        inv.fertilizerItems?.forEach(item => {
          if (item.fertilizerName && item.fertilizerName.toLowerCase() === name.toLowerCase()) {
            totalSupplied += item.quantitySupplied;
            totalUsed += (item.quantityUsed || 0);
            metric = item.quantityMetric || metric;
          }
        });
      });

      activities.forEach(act => {
        // Filter activity date if filter active
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

  get generatedReportTotalSupplied(): number {
    return this.generatedReportData.reduce((sum, item) => sum + (item.totalSupplied || 0), 0);
  }

  get generatedReportTotalUsed(): number {
    return this.generatedReportData.reduce((sum, item) => sum + (item.totalUsed || 0), 0);
  }

  get generatedReportTotalRemaining(): number {
    return this.generatedReportData.reduce((sum, item) => sum + (item.remaining || 0), 0);
  }

  exportExcel() {
    if (this.generatedReportData.length === 0) return;

    const data = this.generatedReportData.map(item => ({
      'Fertilizer Name': item.name,
      'Total Supplied (Packets/Litres)': item.totalSupplied,
      'Total Used (Packets/Litres)': item.totalUsed,
      'Remaining Stock (Packets/Litres)': item.remaining
    }));

    data.push({
      'Fertilizer Name': 'Total',
      'Total Supplied (Packets/Litres)': this.generatedReportTotalSupplied,
      'Total Used (Packets/Litres)': this.generatedReportTotalUsed,
      'Remaining Stock (Packets/Litres)': this.generatedReportTotalRemaining
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fertilizer Stock Report');

    const farmName = (this.selectedFarmName || 'farm').replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Fertilizer_Report_${farmName}.xlsx`);
  }

  exportPdf() {
    if (this.generatedReportData.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Fertilizer Usage & Stock Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Farm Name: ${this.selectedFarmName || '-'}`, 14, 28);
    if (this.selectedCropName) {
      doc.text(`Crop Name: ${this.selectedCropName}`, 14, 34);
    }

    const start = this.reportDisplayStartDate ? new Date(this.reportDisplayStartDate).toLocaleDateString('en-GB') : 'All Time';
    const end = this.reportDisplayEndDate ? new Date(this.reportDisplayEndDate).toLocaleDateString('en-GB') : 'All Time';
    doc.text(`Date Range: ${start} to ${end}`, 14, 40);

    const headers = [['Fertilizer Name', 'Total Supplied (Packets/Litres)', 'Total Used (Packets/Litres)', 'Remaining Stock (Packets/Litres)']];
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
    doc.save(`Fertilizer_Report_${farmName}.pdf`);
  }
}

