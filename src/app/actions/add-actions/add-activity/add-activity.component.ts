import { Component, ViewChild, ElementRef, AfterViewInit, inject, effect } from '@angular/core';
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
import { CropFarmSelectorService } from '../../../crop-farm-selector/crop-farm-selector.service';
import { AddActivityService } from './add-activity.service';
import { Activity } from './add-activity.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { CameraControlComponent, CameraControlOutput } from '../../../camera-control/camera-control.component';
import { UploadService } from '../../../file-upload/upload.service';
import { lastValueFrom } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { HttpEvent, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-add-activity',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatRadioModule, 
    TranslateModule, MatIconModule, CameraControlComponent
  ],
  templateUrl: './add-activity.component.html',
  styleUrl: './add-activity.component.css'
})
export class AddActivityComponent implements AfterViewInit {
  @ViewChild('scannerContainer', { static: false }) scannerContainer!: ElementRef;
  @ViewChild(CameraControlComponent, { static: false }) cameraControl!: CameraControlComponent;

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
  showAdditionalFields = false;
  photoFileName: string = '';
  photoFile: File | null = null;
  submitPressed: boolean = false;

  productMappings = ['fertilizerRefill', 'spray'];

  activityTypes = [
    { value: 'watering', label: 'activity.watering' },
    //{ value: 'spraying', label: 'Spraying (Insecticide/Pesticide/Fertilizer)' },
    { value: 'deWeeding', label: 'activity.deWeeding' },
    //{ value: 'fertilizer', label: 'activity.fertilizer' },
    { value: 'spray', label: 'activity.spray' },
    { value: 'reSeeding', label: 'activity.reSeeding' },
    { value: 'growingMediaAddition', label: 'activity.growingMediaAddition' },
    { value: 'reWatering', label: 'activity.reWatering' },
    { value: 'fertilizerRefill', label: 'activity.fertilizerRefill' },
    { value: 'drenching', label: 'activity.drenching' },
    { value: 'photoCapture', label: 'activity.photoCapture' }
  ];

  constructor(private fb: FormBuilder, private addActivityService: AddActivityService, private uploadService: UploadService) {
    this.activityForm = this.fb.group({
      type: ['watering', Validators.required],
      message: ['', Validators.required],
      productName: [''],
      quantity: [null]
    });

    this.activityForm.get('type')?.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(type => {
      console.log(type);
      const productNameControl = this.activityForm.get('productName');
      
      if(this.productMappings.includes(type)) {
        this.showAdditionalFields = true;
        // Make productName mandatory for spray and fertilizerRefill
        productNameControl?.setValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        this.showAdditionalFields = false;
        // Make productName optional for other types
        productNameControl?.setValidators([Validators.maxLength(100)]);
      }
      productNameControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.activityTypes.sort((a, b) => a.label.localeCompare(b.label));
  }

  ngAfterViewInit() {
    // Initialize scanner only when needed
  }

  onPhotoCapture(output: CameraControlOutput) {
    if (output.success && output.fileBlob) {
      this.photoFile = new File([output.fileBlob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });;
      this.photoFileName = output.filename;
      console.log('Photo captured:', this.photoFileName);
      this.snackBar.open('Photo ready to submit', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Failed to capture photo', 'Close', { duration: 5000 });
    }
  }

  onPhotoCancel() {
    this.photoFile = null;
    this.photoFileName = '';
    console.log('Photo capture cancelled');
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
        console.log('Scanned Data:', scannedData);
        this.populateFormFromScan(scannedData);
      } catch {
        console.log('In the catch block: decoded Text:', decodedText);
        this.activityForm.patchValue({ message: `Scanned: ${decodedText}` });
      }
      setTimeout(() => this.scanInProgress = false, 2000);
      this.stopScanner()
    }
  }

  private onScanError() {
    // Silent fail - continue scanning
  }

  private populateFormFromScan(scannedData: any) {
    const { productName, type } = scannedData;
    if (productName) this.activityForm.patchValue({ productName });
    if (type) this.activityForm.patchValue({ type });
    this.activityForm.patchValue({ message: `Scanned: Product - ${productName}, type - ${type}` });
  }

  toggleScanMode() {
    if (this.scanMode) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  async onSubmit() {
    if (!this.submitPressed) {
      return;
    }
    this.submitPressed = false;

    // Validate that productName is provided for spray and fertilizerRefill activities
    const activityType = this.activityForm.value.type;
    const productName = this.activityForm.value.productName;
    
    if (this.productMappings.includes(activityType) && !productName?.trim()) {
      this.snackBar.open('Product name is required for this activity type', 'Close', { duration: 3000 });
      return;
    }

    if (this.activityForm.valid && this.selectedCropId && this.selectedCropId !== environment.tempCropId) {
      //add logic to handle photo upload if photoFile is not null
      let photoPath = '';
      if (this.photoFile) {
        photoPath = await this.uploadFile(this.photoFile);
      }

      //console.log('Activity Form Data:', this.activityForm.value);

      let activity: Activity = {
        activityType: this.activityForm.value.type,
        message: this.activityForm.value.message,
        activityId: Date.now().toString(),
        productName: this.activityForm.value.productName,
        quantity: this.activityForm.value.quantity,
        cropId: this.selectedCropId,
        photo: photoPath
      };

      console.log('Activity Object:', activity);

      this.addActivityService.addActivity(activity).subscribe({
        next: (response) => {
          console.log('Activity successfully saved:', response);
          this.snackBar.open('Activity successfully saved!', 'Close', { duration: 5000 });
          // Reset form and camera after successful submission
          this.reset();
        },
        error: (error) => {
          console.error('Error saving activity:', error);
          this.snackBar.open('Error saving activity. Please try again.', 'Close', { duration: 5000 });
        }
      });
      // this.qrResult = null;
      // if (this.scanMode) this.stopScanner();
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const body = await lastValueFrom(
        this.uploadService.upload(file).pipe(
          filter((e: HttpEvent<any>) => e.type === HttpEventType.Response),
          map((e: any) => e.body)
        )
      );
      return body?.fullPath || '';
    } catch (err) {
      console.error('Upload failed', err);
      throw err;
    }
  }

  get buttonLabel(): string {
    return this.scanMode ? 'common.switchToManual' : 'common.scanQRCode';
  }

  reset() {
    this.activityForm.reset();
    this.photoFile = null;
    this.photoFileName = '';
    this.qrResult = null;
    if (this.scanMode) this.stopScanner();
    if (this.cameraControl) {
      this.cameraControl.reset();
    }
  }
}
