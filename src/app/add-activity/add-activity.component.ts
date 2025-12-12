import { Component, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CropFarmSelectorService } from '../crop-farm-selector/crop-farm-selector.service';
import { AddActivityService } from './add-activity.service';
import { Activity } from './add-activity.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-activity',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatRadioModule
  ],
  templateUrl: './add-activity.component.html',
  styleUrl: './add-activity.component.css'
})
export class AddActivityComponent implements AfterViewInit {
  @ViewChild('scannerContainer', { static: false }) scannerContainer!: ElementRef;

  private snackBar = inject(MatSnackBar);
  //#region gets the global selected crop farm
  // inject the service
  private readonly cropFarmSelector = inject(CropFarmSelectorService);

  // convenient getter for template / code
  get selectedCropFarm() {
    return this.cropFarmSelector.selectedCropFarm(); // SelectedCropFarm | null
  }

  // If you want direct ids/names:
  get selectedFarmId()  { return this.cropFarmSelector.selectedFarmId(); }
  get selectedCropId()  { return this.cropFarmSelector.selectedCropId(); }
  get selectedFarmName(){ return this.cropFarmSelector.selectedFarmName(); }
  get selectedCropName(){ return this.cropFarmSelector.selectedCropName(); }
  //#endregion gets the global selected crop farm

  activityForm: FormGroup;
  scanMode = false;
  scanner!: Html5QrcodeScanner;
  qrResult: string | null = null;
  scanInProgress = false;

  activityTypes = [
    { value: 'watering', label: 'Watering' },
    { value: 'spraying', label: 'Spraying (Insecticide/Pesticide/Fertilizer)' },
    { value: 'deweeding', label: 'De-weeding' }
  ];

  constructor(private fb: FormBuilder, private addActivityService: AddActivityService) {
    this.activityForm = this.fb.group({
      dateTime: [new Date(), Validators.required],
      type: ['watering', Validators.required],
      message: ['', Validators.required],
      productName: [''],
      constituents: [''],
      quantity: [null],
      isOrganic: [false]
    });
  }

  ngAfterViewInit() {
    // Initialize scanner only when needed
  }

  startScanner() {
    this.scanMode = true;
    this.scanner = new Html5QrcodeScanner(
      'scanner-container',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    this.scanner.render(
      this.onScanSuccess.bind(this),
      this.onScanError.bind(this)
    );
  }

  stopScanner() {
    if (this.scanner) {
      this.scanner.clear();
    }
    this.scanMode = false;
  }

  private onScanSuccess(decodedText: string) {
    if (!this.scanInProgress) {
      this.scanInProgress = true;
      this.qrResult = decodedText;
      try {
        const scannedData = JSON.parse(decodedText);
        this.populateFormFromScan(scannedData);
      } catch {
        this.activityForm.patchValue({ message: `Scanned: ${decodedText.slice(0, 50)}...` });
      }
      setTimeout(() => this.scanInProgress = false, 2000);
    }
  }

  private onScanError() {
    // Silent fail - continue scanning
  }

  private populateFormFromScan(scannedData: any) {
    const { productName, constituents, quantity, isOrganic, type } = scannedData;
    if (productName) this.activityForm.patchValue({ productName });
    if (constituents) this.activityForm.patchValue({ constituents });
    if (quantity) this.activityForm.patchValue({ quantity: parseFloat(quantity) });
    if (isOrganic !== undefined) this.activityForm.patchValue({ isOrganic });
    if (type) this.activityForm.patchValue({ type });
    this.activityForm.patchValue({ message: `Scanned: ${productName || 'Product'}` });
  }

  toggleScanMode() {
    if (this.scanMode) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  onSubmit() {
    if (this.activityForm.valid && this.selectedCropId) {
      
      console.log('Activity Form Data:', this.activityForm.value);

      let activity: Activity = {
        activityType: this.activityForm.value.type,
        message: this.activityForm.value.message,
        activityId: Date.now().toString(),
        cropId: this.selectedCropId
      };

      console.log('Activity Object:', activity);

      this.addActivityService.addActivity(activity).subscribe({
        next: (response) => {
          console.log('Activity successfully saved:', response);
          this.snackBar.open('Activity successfully saved!', 'Close', { duration: 5000 });
        },
        error: (error) => {
          console.error('Error saving activity:', error);
          this.snackBar.open('Error saving activity. Please try again.', 'Close', { duration: 5000 });
        }
      });

      //this.activityForm.reset({ dateTime: new Date() });
      this.qrResult = null;
      if (this.scanMode) this.stopScanner();
    }
  }

  reset() {
    this.activityForm.reset();
    this.qrResult = null;
    if (this.scanMode) this.stopScanner();
  }
}
