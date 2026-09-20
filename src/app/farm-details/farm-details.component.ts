import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { FarmService } from '../farm-lookup/farm-service';
import { DashboardService } from '../home-dashboard/dashboard.service';
import { AddressService } from '../farm-registration/address.service';
import { FileServerService } from '../file-upload/file-server.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { UpdateFarmDto } from '../farm-registration/farm';
import { District, Hobli, State, SubDistrict, Taluka, Village } from '../farm-registration/address.models';
import { EntitySearchService, FarmOwnerSearchResult, FarmHelpSearchResult, SearchResult } from '../entity-search/entity-search.service';
import { EntitySearchDialogComponent } from '../entity-search/entity-search-dialog/entity-search-dialog.component';

export interface FarmOptionItem {
  farmId: string;
  farmName: string;
  location?: string;
  rawFarm?: any;
}

@Component({
  selector: 'app-farm-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    FileUploadComponent
  ],
  templateUrl: './farm-details.component.html',
  styleUrls: ['./farm-details.component.css']
})
export class FarmDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private farmService = inject(FarmService);
  private dashboardService = inject(DashboardService);
  private addressService = inject(AddressService);
  private fileServerService = inject(FileServerService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private entitySearchService = inject(EntitySearchService);

  // Signals
  farmsList = signal<FarmOptionItem[]>([]);
  selectedFarmId = signal<string>('');
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isUploadingCert = signal<boolean>(false);
  showUploadSection = signal<boolean>(false);

  // Personnel signals
  selectedOwner = signal<FarmOwnerSearchResult | null>(null);
  selectedMaintainer = signal<FarmHelpSearchResult | null>(null);
  isLoadingOwner = signal<boolean>(false);
  isLoadingMaintainer = signal<boolean>(false);

  // Address signals
  states = signal<{ stateName: string; stateCode: number }[]>([]);
  districts = signal<District[]>([]);
  subDistricts = signal<SubDistrict[]>([]);
  talukas = signal<Taluka[]>([]);
  hoblis = signal<Hobli[]>([]);
  villages = signal<Village[]>([]);

  // Raw original farm payload to preserve non-form metadata
  currentFarmData: any = null;

  farmForm: FormGroup = this.fb.group({
    // Basic Info & Personnel
    farmName: ['', [Validators.required]],
    farmOwnerId: ['', [Validators.required]],
    farmMaintainerId: [''],
    
    // Address Details
    pincode: [''],
    state: [''],
    district: [''],
    subDistrict: [''],
    taluka: [''],
    hobli: [''],
    village: [''],
    surveyNumber: [''],
    hissa: [''],
    addressLine: [''],

    // Infrastructure & Facilities
    shadeNetArea: [0, [Validators.required, Validators.min(0)]],
    farmPondVolume: [0, [Validators.required, Validators.min(0)]],
    automationRoomSize: [0, [Validators.required, Validators.min(0)]],
    storageAreaNote: [''],

    // Power & Water Management
    motorCapacity: ['5.5 HP', [Validators.required]],
    additionalWaterSource: [''],
    isSolarPowerAvailable: [false],
    isSinglePhasePower: [false],
    isThreePhasePower: [true],

    // Certificate
    waterTestCertificateUrl: [''],

    // Geolocation
    latitude: [null],
    longitude: [null]
  });

  isKarnataka = computed(() => {
    const stateVal = this.farmForm.get('state')?.value;
    if (typeof stateVal === 'string') {
      return stateVal.trim().toLowerCase() === 'karnataka';
    }
    if (stateVal && typeof stateVal === 'object' && stateVal.stateName) {
      return stateVal.stateName.trim().toLowerCase() === 'karnataka';
    }
    return false;
  });

  ngOnInit(): void {
    this.loadStates();
    this.loadAllFarms();

    // Listen to state changes to load cascading districts
    this.farmForm.get('state')?.valueChanges.subscribe((stateVal) => {
      this.onStateChanged(stateVal);
    });
  }

  loadStates(): void {
    this.addressService.getAllStates().subscribe({
      next: (states) => this.states.set(states || []),
      error: (err) => console.warn('Could not load states', err)
    });
  }

  loadAllFarms(): void {
    this.isLoading.set(true);
    this.dashboardService.getAllFarmCrops().subscribe({
      next: (farms: any[]) => {
        const uniqueFarmsMap = new Map<string, FarmOptionItem>();
        if (Array.isArray(farms)) {
          for (const f of farms) {
            const id = f.farmId || f.Id || f.id;
            const name = f.farmName || f.FarmName || f.name || 'Unnamed Farm';
            if (id && !uniqueFarmsMap.has(id)) {
              uniqueFarmsMap.set(id, { farmId: id, farmName: name, rawFarm: f });
            }
          }
        }
        const farmList = Array.from(uniqueFarmsMap.values());
        this.farmsList.set(farmList);

        // Check if query param has farmId
        const queryFarmId = this.route.snapshot.queryParamMap.get('farmId') || this.route.snapshot.paramMap.get('farmId');
        if (queryFarmId && uniqueFarmsMap.has(queryFarmId)) {
          this.onSelectFarm(queryFarmId);
        } else if (farmList.length > 0) {
          this.onSelectFarm(farmList[0].farmId);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load farms list', err);
        this.isLoading.set(false);
        this.snackBar.open('Failed to load registered farms list', 'Close', { duration: 4000 });
      }
    });
  }

  onSelectFarm(farmId: string): void {
    if (!farmId) return;
    this.selectedFarmId.set(farmId);
    this.showUploadSection.set(false);
    this.loadFarmDetails(farmId);
  }

  loadFarmDetails(farmId: string): void {
    this.isLoading.set(true);
    const farmOption = this.farmsList().find(f => f.farmId === farmId);
    const fallbackRaw = farmOption?.rawFarm;

    this.farmService.getFarmById(farmId).subscribe({
      next: (data: any) => {
        console.log('Farm details loaded from getFarmById:', data);
        console.log('Fallback farm details from list:', fallbackRaw);
        this.currentFarmData = data || fallbackRaw;
        this.populateForm(data, fallbackRaw);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Error fetching farm details from getFarmById, trying fallback from list:', err);
        if (fallbackRaw) {
          this.currentFarmData = fallbackRaw;
          this.populateForm(fallbackRaw);
          this.isLoading.set(false);
        } else {
          this.isLoading.set(false);
          this.snackBar.open('Could not load farm details for the selected farm', 'Close', { duration: 4000 });
        }
      }
    });
  }

  /**
   * Helper to robustly extract certificate URL regardless of casing (camelCase vs PascalCase),
   * nested structure, or key variations.
   */
  extractCertificateUrl(data: any): string {
    if (!data) return '';
    if (Array.isArray(data)) {
      data = data[0];
    }
    if (!data || typeof data !== 'object') {
      return typeof data === 'string' ? data.trim() : '';
    }

    // Direct property names commonly used
    const keysToCheck = [
      'waterTestCertificateUrl',
      'WaterTestCertificateUrl',
      'waterTestCertificateURL',
      'WaterTestCertificateURL',
      'waterTestCertificate',
      'WaterTestCertificate',
      'waterCertificateUrl',
      'WaterCertificateUrl',
      'certificateUrl',
      'CertificateUrl',
      'waterTestReportUrl',
      'WaterTestReportUrl',
      'certificate',
      'Certificate',
      'fileUrl',
      'FileUrl',
      'fullPath',
      'FullPath',
      'filePath',
      'FilePath'
    ];

    for (const key of keysToCheck) {
      if (data[key] && typeof data[key] === 'string' && data[key].trim() !== '') {
        return data[key].trim();
      }
    }

    // Check nested wrappers
    const nested = data.data || data.farm || data.result;
    if (nested && typeof nested === 'object') {
      const nestedResult = this.extractCertificateUrl(nested);
      if (nestedResult) return nestedResult;
    }

    // Check nested documents object
    if (data.documents && typeof data.documents === 'object') {
      const docResult = this.extractCertificateUrl(data.documents);
      if (docResult) return docResult;
    }

    // Case-insensitive search across object keys
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (
        (lowerKey.includes('certificate') || lowerKey.includes('watertest') || lowerKey.includes('watercert')) &&
        typeof data[key] === 'string' &&
        data[key].trim() !== ''
      ) {
        return data[key].trim();
      }
    }

    return '';
  }

  populateForm(data: any, fallbackRaw?: any): void {
    const raw: any = Array.isArray(data) ? data[0] : (data?.data || data?.farm || data || fallbackRaw || {});
    const fallback: any = fallbackRaw || {};

    // Parse address safely whether it is an object or string
    let addr: any = raw.address || raw.Address || fallback.address || fallback.Address || {};
    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch {
        addr = { addressLine: addr };
      }
    }

    const stateName = typeof addr.state === 'string' ? addr.state : (addr.state?.stateName || addr.State || '');
    const districtName = typeof addr.district === 'string' ? addr.district : (addr.district?.districtName || addr.District || '');
    const talukaName = typeof addr.taluka === 'string' ? addr.taluka : (addr.taluka?.talukaName || addr.Taluka || '');
    const hobliName = typeof addr.hobli === 'string' ? addr.hobli : (addr.hobli?.hobliName || addr.Hobli || '');
    const villageName = typeof addr.village === 'string' ? addr.village : (addr.village?.villageName || addr.Village || '');
    const subDistrictName = typeof addr.subDistrict === 'string' ? addr.subDistrict : (addr.subDistrict?.subDistrictName || addr.SubDistrict || '');

    // Robust certificate extraction from all possible sources
    const certUrl = this.extractCertificateUrl(raw) || this.extractCertificateUrl(fallback) || '';
    console.log('Extracted waterTestCertificateUrl:', certUrl);

    // Geolocation extraction
    const geo = raw.geoLocation || raw.GeoLocation || raw.geoTag || raw.GeoTag || fallback.geoLocation || fallback.GeoLocation;
    let lat = geo?.latitude ?? geo?.Latitude ?? null;
    let lng = geo?.longitude ?? geo?.Longitude ?? null;

    this.farmForm.patchValue({
      farmName: raw.farmName || raw.FarmName || fallback.farmName || fallback.FarmName || '',
      farmOwnerId: raw.farmOwnerId || raw.FarmOwnerId || fallback.farmOwnerId || fallback.FarmOwnerId || '',
      farmMaintainerId: raw.farmMaintainerId || raw.FarmMaintainerId || fallback.farmMaintainerId || fallback.FarmMaintainerId || '',

      pincode: addr.pincode || addr.Pincode || '',
      state: stateName,
      district: districtName,
      taluka: talukaName,
      hobli: hobliName,
      village: villageName,
      subDistrict: subDistrictName,
      surveyNumber: raw.surveyNumber || raw.SurveyNumber || addr.surveyNumber || addr.SurveyNumber || '',
      hissa: raw.hissa || raw.Hissa || addr.hissa || addr.Hissa || '',
      addressLine: addr.addressLine || addr.AddressLine || '',

      shadeNetArea: raw.shadeNetArea ?? raw.ShadeNetArea ?? fallback.shadeNetArea ?? fallback.ShadeNetArea ?? 0,
      farmPondVolume: raw.farmPondVolume ?? raw.FarmPondVolume ?? fallback.farmPondVolume ?? fallback.FarmPondVolume ?? 0,
      automationRoomSize: raw.automationRoomSize ?? raw.AutomationRoomSize ?? fallback.automationRoomSize ?? fallback.AutomationRoomSize ?? 0,
      storageAreaNote: raw.storageAreaNote || raw.StorageAreaNote || fallback.storageAreaNote || fallback.StorageAreaNote || '',

      motorCapacity: raw.motorCapacity || raw.MotorCapacity || fallback.motorCapacity || fallback.MotorCapacity || '5.5 HP',
      additionalWaterSource: raw.additionalWaterSource || raw.AdditionalWaterSource || fallback.additionalWaterSource || fallback.AdditionalWaterSource || '',
      isSolarPowerAvailable: Boolean(raw.isSolarPowerAvailable ?? raw.IsSolarPowerAvailable ?? fallback.isSolarPowerAvailable ?? fallback.IsSolarPowerAvailable ?? false),
      isSinglePhasePower: Boolean(raw.isSinglePhasePower ?? raw.IsSinglePhasePower ?? fallback.isSinglePhasePower ?? fallback.IsSinglePhasePower ?? false),
      isThreePhasePower: (raw.isThreePhasePower !== undefined || raw.IsThreePhasePower !== undefined) 
        ? Boolean(raw.isThreePhasePower ?? raw.IsThreePhasePower) 
        : true,

      waterTestCertificateUrl: certUrl,

      latitude: lat,
      longitude: lng
    });

    const ownerId = raw.farmOwnerId || raw.FarmOwnerId || fallback.farmOwnerId || fallback.FarmOwnerId || '';
    const maintainerId = raw.farmMaintainerId || raw.FarmMaintainerId || fallback.farmMaintainerId || fallback.FarmMaintainerId || '';
    this.resolveOwnerDetails(ownerId, raw);
    this.resolveMaintainerDetails(maintainerId, raw);

    if (stateName) {
      this.loadDistrictsForState(stateName);
    }
  }

  onStateChanged(stateVal: any): void {
    const stateName = typeof stateVal === 'string' ? stateVal : (stateVal?.stateName || '');
    if (stateName) {
      this.loadDistrictsForState(stateName);
    }
  }

  loadDistrictsForState(stateName: string): void {
    if (stateName.trim().toLowerCase() === 'karnataka') {
      this.addressService.getKarnatakaDistricts().subscribe({
        next: (dists) => this.districts.set(dists || []),
        error: (err) => console.warn('Error loading Karnataka districts', err)
      });
    } else {
      this.addressService.getDistrictsByState(stateName).subscribe({
        next: (dists) => this.districts.set(dists || []),
        error: (err) => console.warn('Error loading districts for ' + stateName, err)
      });
    }
  }

  getCertificateFileName(url: string | null | undefined): string {
    if (!url) return '';
    const parts = url.split(/[\\\/]/);
    return parts[parts.length - 1] || url;
  }

  getCertificateDownloadUrl(): string | null {
    const certUrl = this.farmForm.get('waterTestCertificateUrl')?.value;
    if (!certUrl) return null;
    return this.fileServerService.getImageUrl(certUrl);
  }

  viewCertificate(): void {
    const url = this.getCertificateDownloadUrl();
    if (url) {
      window.open(url, '_blank');
    } else {
      this.snackBar.open('No certificate file URL found', 'Close', { duration: 3000 });
    }
  }

  handleCertificateUploaded(data: any): void {
    console.log('New certificate uploaded in Farm Details:', data);
    const uploadedPath = this.extractCertificateUrl(data) ||
      data?.fullPath || data?.FullPath ||
      data?.filePath || data?.FilePath ||
      data?.fileName || data?.FileName ||
      data?.path || data?.Path ||
      data?.url || data?.Url ||
      (typeof data === 'string' ? data : '');

    if (uploadedPath) {
      this.farmForm.patchValue({ waterTestCertificateUrl: uploadedPath });
      this.showUploadSection.set(false);
      // Immediately save changes so the uploaded certificate persists to the server
      this.saveFarmDetails(true);
      this.snackBar.open('Certificate uploaded and attached to farm!', 'Close', { duration: 4000 });
    } else {
      this.snackBar.open('Could not read uploaded certificate path', 'Close', { duration: 4000 });
    }
  }

  removeCertificate(): void {
    this.farmForm.patchValue({ waterTestCertificateUrl: '' });
    this.saveFarmDetails(true);
    this.snackBar.open('Certificate detached and changes saved.', 'Close', { duration: 3000 });
  }

  saveFarmDetails(isAutoSave: boolean = false): void {
    if (this.farmForm.invalid) {
      this.farmForm.markAllAsTouched();
      this.snackBar.open('Please verify required fields before saving', 'Close', { duration: 4000 });
      return;
    }

    const farmId = this.selectedFarmId();
    if (!farmId) {
      this.snackBar.open('No farm selected to update', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);
    const val = this.farmForm.value;

    const stateStr = typeof val.state === 'string' ? val.state : (val.state?.stateName || '');
    const districtStr = typeof val.district === 'string' ? val.district : (val.district?.districtName || '');
    const talukaStr = typeof val.taluka === 'string' ? val.taluka : (val.taluka?.talukaName || '');
    const hobliStr = typeof val.hobli === 'string' ? val.hobli : (val.hobli?.hobliName || '');
    const villageStr = typeof val.village === 'string' ? val.village : (val.village?.villageName || '');
    const subDistrictStr = typeof val.subDistrict === 'string' ? val.subDistrict : (val.subDistrict?.subDistrictName || '');

    const updatedAddress = this.isKarnataka() ? {
      pincode: val.pincode || '',
      state: stateStr,
      district: districtStr,
      taluka: talukaStr,
      hobli: hobliStr,
      village: villageStr,
      surveyNumber: val.surveyNumber || '',
      hissa: val.hissa || '',
      addressLine: val.addressLine || ''
    } : {
      pincode: val.pincode || '',
      state: stateStr,
      district: districtStr,
      subDistrict: subDistrictStr,
      village: villageStr,
      addressLine: val.addressLine || '',
      surveyNumber: val.surveyNumber || ''
    };

    const certVal = val.waterTestCertificateUrl || '';

    const ownerId = val.farmOwnerId !== undefined && val.farmOwnerId !== null && String(val.farmOwnerId).trim() !== ''
      ? String(val.farmOwnerId).trim()
      : (this.currentFarmData?.farmOwnerId || this.currentFarmData?.FarmOwnerId || '');

    const maintainerId = val.farmMaintainerId !== undefined && val.farmMaintainerId !== null
      ? String(val.farmMaintainerId).trim()
      : (this.currentFarmData?.farmMaintainerId || this.currentFarmData?.FarmMaintainerId || '');

    // Supply both camelCase and PascalCase properties for robust backend model binding
    const updatePayload: any = {
      ...this.currentFarmData,
      farmName: val.farmName,
      FarmName: val.farmName,
      farmId: farmId,
      FarmId: farmId,
      surveyNumber: val.surveyNumber,
      SurveyNumber: val.surveyNumber,
      farmOwnerId: ownerId,
      FarmOwnerId: ownerId,
      farmMaintainerId: maintainerId,
      FarmMaintainerId: maintainerId,
      address: updatedAddress,
      Address: updatedAddress,
      shadeNetArea: Number(val.shadeNetArea) || 0,
      ShadeNetArea: Number(val.shadeNetArea) || 0,
      farmPondVolume: Number(val.farmPondVolume) || 0,
      FarmPondVolume: Number(val.farmPondVolume) || 0,
      automationRoomSize: Number(val.automationRoomSize) || 0,
      AutomationRoomSize: Number(val.automationRoomSize) || 0,
      storageAreaNote: val.storageAreaNote || '',
      StorageAreaNote: val.storageAreaNote || '',
      motorCapacity: val.motorCapacity || '',
      MotorCapacity: val.motorCapacity || '',
      additionalWaterSource: val.additionalWaterSource || '',
      AdditionalWaterSource: val.additionalWaterSource || '',
      isSolarPowerAvailable: Boolean(val.isSolarPowerAvailable),
      IsSolarPowerAvailable: Boolean(val.isSolarPowerAvailable),
      isSinglePhasePower: Boolean(val.isSinglePhasePower),
      IsSinglePhasePower: Boolean(val.isSinglePhasePower),
      isThreePhasePower: Boolean(val.isThreePhasePower),
      IsThreePhasePower: Boolean(val.isThreePhasePower),
      waterTestCertificateUrl: certVal,
      WaterTestCertificateUrl: certVal,
      waterTestCertificate: certVal,
      WaterTestCertificate: certVal,
      geoLocation: (val.latitude != null && val.longitude != null) ? {
        latitude: Number(val.latitude),
        longitude: Number(val.longitude)
      } : (this.currentFarmData?.geoLocation || this.currentFarmData?.GeoLocation || null),
      GeoLocation: (val.latitude != null && val.longitude != null) ? {
        latitude: Number(val.latitude),
        longitude: Number(val.longitude)
      } : (this.currentFarmData?.geoLocation || this.currentFarmData?.GeoLocation || null),
      historicalWeather: this.currentFarmData?.historicalWeather || this.currentFarmData?.HistoricalWeather || null,
      Crops: this.currentFarmData?.Crops || this.currentFarmData?.crops || []
    };

    this.farmService.updateFarm(farmId, updatePayload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.currentFarmData = { ...this.currentFarmData, ...updatePayload };
        if (!isAutoSave) {
          this.snackBar.open('Farm details updated successfully!', 'Close', { duration: 4000 });
        }
      },
      error: (err) => {
        console.error('Failed to update farm details', err);
        this.isSaving.set(false);
        this.snackBar.open('Failed to update farm details. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  resetForm(): void {
    if (this.currentFarmData) {
      this.populateForm(this.currentFarmData);
      this.snackBar.open('Form reset to saved farm details', 'Close', { duration: 2500 });
    }
  }

  resolveOwnerDetails(ownerId: string, rawData?: any): void {
    if (!ownerId) {
      this.selectedOwner.set(null);
      return;
    }

    const rawName = rawData?.farmOwnerName || rawData?.FarmOwnerName || rawData?.ownerName || rawData?.OwnerName || rawData?.farmOwner?.name || rawData?.FarmOwner?.Name;
    const rawContact = rawData?.farmOwnerContact || rawData?.FarmOwnerContact || rawData?.ownerContact || rawData?.OwnerContact || rawData?.farmOwner?.contactNumber;

    if (rawName) {
      this.selectedOwner.set({
        id: ownerId,
        name: rawName,
        contactNumber: rawContact || ''
      });
      return;
    }

    this.isLoadingOwner.set(true);
    this.entitySearchService.searchEntity('FarmOwner', ownerId).subscribe({
      next: (res) => {
        this.isLoadingOwner.set(false);
        if (res.success && res.data && res.data.length > 0) {
          const match = res.data.find(d => String(d.id).trim().toLowerCase() === String(ownerId).trim().toLowerCase()) || res.data[0];
          this.selectedOwner.set(match as FarmOwnerSearchResult);
        } else {
          this.selectedOwner.set({
            id: ownerId,
            name: 'Owner (' + ownerId + ')',
            contactNumber: ''
          });
        }
      },
      error: (err) => {
        console.warn('Could not lookup owner details for ID:', ownerId, err);
        this.isLoadingOwner.set(false);
        this.selectedOwner.set({
          id: ownerId,
          name: 'Owner (' + ownerId + ')',
          contactNumber: ''
        });
      }
    });
  }

  resolveMaintainerDetails(maintainerId: string, rawData?: any): void {
    if (!maintainerId) {
      this.selectedMaintainer.set(null);
      return;
    }

    const rawName = rawData?.farmMaintainerName || rawData?.FarmMaintainerName || rawData?.maintainerName || rawData?.MaintainerName || rawData?.farmMaintainer?.name || rawData?.FarmMaintainer?.Name;
    const rawContact = rawData?.farmMaintainerContact || rawData?.FarmMaintainerContact || rawData?.maintainerContact || rawData?.MaintainerContact || rawData?.farmMaintainer?.contactNumber;

    if (rawName) {
      this.selectedMaintainer.set({
        id: maintainerId,
        name: rawName,
        contactNumber: rawContact || ''
      });
      return;
    }

    this.isLoadingMaintainer.set(true);
    this.entitySearchService.searchEntity('FarmHelp', maintainerId).subscribe({
      next: (res) => {
        this.isLoadingMaintainer.set(false);
        if (res.success && res.data && res.data.length > 0) {
          const match = res.data.find(d => String(d.id).trim().toLowerCase() === String(maintainerId).trim().toLowerCase()) || res.data[0];
          this.selectedMaintainer.set(match as FarmHelpSearchResult);
        } else {
          this.selectedMaintainer.set({
            id: maintainerId,
            name: 'Farm Help (' + maintainerId + ')',
            contactNumber: ''
          });
        }
      },
      error: (err) => {
        console.warn('Could not lookup maintainer details for ID:', maintainerId, err);
        this.isLoadingMaintainer.set(false);
        this.selectedMaintainer.set({
          id: maintainerId,
          name: 'Farm Help (' + maintainerId + ')',
          contactNumber: ''
        });
      }
    });
  }

  openOwnerSearchDialog(): void {
    const dialogRef = this.dialog.open(EntitySearchDialogComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: {
        preselectedEntityType: 'FarmOwner',
        isEntityTypeDisabled: true
      }
    });

    dialogRef.afterClosed().subscribe((result: SearchResult | null) => {
      if (result) {
        this.farmForm.patchValue({ farmOwnerId: result.id });
        this.farmForm.get('farmOwnerId')?.markAsDirty();
        this.selectedOwner.set(result as FarmOwnerSearchResult);
        this.snackBar.open(`Selected Farm Owner: ${result.name} (${result.id})`, 'Close', { duration: 3000 });
      }
    });
  }

  openMaintainerSearchDialog(): void {
    const dialogRef = this.dialog.open(EntitySearchDialogComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: {
        preselectedEntityType: 'FarmHelp',
        isEntityTypeDisabled: true
      }
    });

    dialogRef.afterClosed().subscribe((result: SearchResult | null) => {
      if (result) {
        this.farmForm.patchValue({ farmMaintainerId: result.id });
        this.farmForm.get('farmMaintainerId')?.markAsDirty();
        this.selectedMaintainer.set(result as FarmHelpSearchResult);
        this.snackBar.open(`Selected Farm Help: ${result.name} (${result.id})`, 'Close', { duration: 3000 });
      }
    });
  }

  clearMaintainer(): void {
    this.farmForm.patchValue({ farmMaintainerId: '' });
    this.farmForm.get('farmMaintainerId')?.markAsDirty();
    this.selectedMaintainer.set(null);
    this.snackBar.open('Farm Help / Maintainer removed from farm', 'Close', { duration: 2500 });
  }

  onOwnerIdInputBlur(): void {
    const currentId = this.farmForm.get('farmOwnerId')?.value?.trim();
    if (currentId && (!this.selectedOwner() || this.selectedOwner()?.id !== currentId)) {
      this.resolveOwnerDetails(currentId);
    } else if (!currentId) {
      this.selectedOwner.set(null);
    }
  }

  onMaintainerIdInputBlur(): void {
    const currentId = this.farmForm.get('farmMaintainerId')?.value?.trim();
    if (currentId && (!this.selectedMaintainer() || this.selectedMaintainer()?.id !== currentId)) {
      this.resolveMaintainerDetails(currentId);
    } else if (!currentId) {
      this.selectedMaintainer.set(null);
    }
  }
}
