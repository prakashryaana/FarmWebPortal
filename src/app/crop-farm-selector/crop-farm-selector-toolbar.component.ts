import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CropFarmSelectorService, CropOption } from './crop-farm-selector.service';
import { CropFarmSelectorDialogComponent } from './crop-farm-selector-dialog.component';
import { AuthService } from '../auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';

export interface FarmOptionItem {
  farmId: string;
  farmName: string;
}

export interface CropOptionItem {
  cropId: string;
  cropName: string;
}

@Component({
  selector: 'app-crop-farm-selector-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './crop-farm-selector-toolbar.component.html',
  styleUrls: ['./crop-farm-selector-toolbar.component.css']
})
export class CropFarmSelectorToolbarComponent implements OnInit, OnDestroy {
  selectedFarmId = '';
  selectedCropId = '';
  selectedFarmName = '';
  selectedCropName = '';
  hasSelection = false;
  isLoading = false;

  allCropOptions: CropOption[] = [];
  farmsList: FarmOptionItem[] = [];
  currentFarmCrops: CropOptionItem[] = [];

  private updateInterval: any;
  private authService = inject(AuthService);

  constructor(
    private selectorService: CropFarmSelectorService,
    private dialog: MatDialog
  ) {
    this.loadCropFarmForLoggedInUser();
  }

  ngOnInit(): void {
    // Initial sync
    this.updateSelection();

    // Polling to keep local state synced with service changes (e.g. from dialog or dashboard)
    this.updateInterval = setInterval(() => {
      this.syncFromServiceSignals();
    }, 200);
  }

  loadCropFarmForLoggedInUser(): void {
    if (!this.authService?.currentUser$) return;

    this.authService.currentUser$.subscribe(currentUser => {
      if (currentUser && currentUser.userId) {
        this.fetchOptionsAndInit();
      }
    });
  }

  private fetchOptionsAndInit(): void {
    if (!this.selectorService?.getCropFarmForUser) return;

    this.isLoading = true;
    this.selectorService.getCropFarmForUser().subscribe({
      next: (options: CropOption[]) => {
        this.isLoading = false;
        this.allCropOptions = options || [];
        this.buildFarmsList();
        this.initOrSyncSelection();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load crop farm options for selector toolbar', err);
      }
    });
  }

  buildFarmsList(): void {
    const farmMap = new Map<string, string>();
    for (const opt of this.allCropOptions) {
      if (opt.farmId && !farmMap.has(opt.farmId)) {
        farmMap.set(opt.farmId, opt.farmName || 'Unnamed Farm');
      }
    }
    this.farmsList = Array.from(farmMap.entries()).map(([farmId, farmName]) => ({
      farmId,
      farmName
    }));
  }

  getCropsForFarm(farmId: string): CropOptionItem[] {
    const cropsMap = new Map<string, string>();
    for (const opt of this.allCropOptions) {
      if (opt.farmId === farmId && opt.cropId && opt.cropId !== 'NA') {
        if (!cropsMap.has(opt.cropId)) {
          cropsMap.set(opt.cropId, opt.cropName || 'Unnamed Crop');
        }
      }
    }
    return Array.from(cropsMap.entries()).map(([cropId, cropName]) => ({
      cropId,
      cropName
    }));
  }

  private initOrSyncSelection(): void {
    const svcFarmId = this.selectorService.selectedFarmId?.();
    const svcCropId = this.selectorService.selectedCropId?.();

    if (svcFarmId && this.farmsList.some(f => f.farmId === svcFarmId)) {
      this.selectedFarmId = svcFarmId;
      const farm = this.farmsList.find(f => f.farmId === svcFarmId);
      this.selectedFarmName = farm ? farm.farmName : (this.selectorService.selectedFarmName?.() || '');
      this.currentFarmCrops = this.getCropsForFarm(svcFarmId);

      if (svcCropId && this.currentFarmCrops.some(c => c.cropId === svcCropId)) {
        this.selectedCropId = svcCropId;
        const crop = this.currentFarmCrops.find(c => c.cropId === svcCropId);
        this.selectedCropName = crop ? crop.cropName : (this.selectorService.selectedCropName?.() || '');
      } else if (this.currentFarmCrops.length > 0) {
        // Default crop is selected (first crop of the farm)
        const defaultCrop = this.currentFarmCrops[0];
        this.selectedCropId = defaultCrop.cropId;
        this.selectedCropName = defaultCrop.cropName;
        this.selectorService.selectCropFarm({
          farmId: this.selectedFarmId,
          farmName: this.selectedFarmName,
          cropId: defaultCrop.cropId,
          cropName: defaultCrop.cropName
        });
      } else {
        this.selectedCropId = 'NA';
        this.selectedCropName = 'NA';
      }
    } else if (this.farmsList.length > 0) {
      // Auto select first farm and its default crop
      this.onFarmChange(this.farmsList[0].farmId);
    }
    this.updateSelectionState();
  }

  onFarmChange(farmId: string): void {
    if (!farmId) return;
    this.selectedFarmId = farmId;
    const farm = this.farmsList.find(f => f.farmId === farmId);
    this.selectedFarmName = farm ? farm.farmName : '';
    this.currentFarmCrops = this.getCropsForFarm(farmId);

    if (this.currentFarmCrops.length > 0) {
      // Default crop is selected for multiple crops (first crop in the list)
      const defaultCrop = this.currentFarmCrops[0];
      this.selectedCropId = defaultCrop.cropId;
      this.selectedCropName = defaultCrop.cropName;
      this.selectorService.selectCropFarm({
        farmId: farm ? farm.farmId : farmId,
        farmName: this.selectedFarmName,
        cropId: defaultCrop.cropId,
        cropName: defaultCrop.cropName
      });
    } else {
      this.selectedCropId = 'NA';
      this.selectedCropName = 'NA';
      this.selectorService.selectCropFarm({
        farmId: farm ? farm.farmId : farmId,
        farmName: this.selectedFarmName,
        cropId: 'NA',
        cropName: 'NA'
      });
    }
    this.updateSelectionState();
  }

  onCropChange(cropId: string): void {
    if (!cropId) return;
    this.selectedCropId = cropId;
    const crop = this.currentFarmCrops.find(c => c.cropId === cropId);
    if (crop) {
      this.selectedCropName = crop.cropName;
      this.selectorService.selectCropFarm({
        farmId: this.selectedFarmId,
        farmName: this.selectedFarmName,
        cropId: crop.cropId,
        cropName: crop.cropName
      });
    }
    this.updateSelectionState();
  }

  private syncFromServiceSignals(): void {
    const svcFarmId = this.selectorService.selectedFarmId?.() || '';
    const svcCropId = this.selectorService.selectedCropId?.() || '';
    const svcFarmName = this.selectorService.selectedFarmName?.() || '';
    const svcCropName = this.selectorService.selectedCropName?.() || '';

    if (svcFarmId && svcFarmId !== this.selectedFarmId) {
      this.selectedFarmId = svcFarmId;
      this.selectedFarmName = svcFarmName;
      this.currentFarmCrops = this.getCropsForFarm(svcFarmId);
      this.selectedCropId = svcCropId;
      this.selectedCropName = svcCropName;
    } else if (svcCropId && svcCropId !== this.selectedCropId) {
      this.selectedCropId = svcCropId;
      this.selectedCropName = svcCropName;
    }

    this.updateSelectionState();
  }

  updateSelection(): void {
    this.selectedFarmId = this.selectorService.selectedFarmId?.() || '';
    this.selectedCropId = this.selectorService.selectedCropId?.() || '';
    this.selectedFarmName = this.selectorService.selectedFarmName?.() || '';
    this.selectedCropName = this.selectorService.selectedCropName?.() || '';
    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    this.hasSelection = !!(this.selectedFarmId && this.selectedCropId);
  }

  openSelectorDialog(): void {
    const dialogRef = this.dialog.open(CropFarmSelectorDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: false,
      closeOnNavigation: true
    });

    dialogRef.afterClosed().subscribe(() => {
      setTimeout(() => {
        this.fetchOptionsAndInit();
      }, 100);
    });
  }

  clearSelection(): void {
    this.selectorService.clearSelection?.();
    this.selectedFarmId = '';
    this.selectedCropId = '';
    this.selectedFarmName = '';
    this.selectedCropName = '';
    this.currentFarmCrops = [];
    this.updateSelectionState();
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
