import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Farm } from './farm';
import { FarmRegistrationService } from './farm-registration.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-farm-registration',
  imports: [ReactiveFormsModule, FileUploadComponent],
  templateUrl: './farm-registration.component.html',
  styleUrl: './farm-registration.component.css',
})
export class FarmRegistrationComponent {
  constructor(private router: Router, private farmRegistrationService: FarmRegistrationService) {}

  farmRegistrationForm = new FormGroup({
    farmName: new FormControl('', [Validators.required]),
    surveyNumber: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    shadeNetArea: new FormControl('', [Validators.required]),
    //geoTag: new FormControl(''),
    farmPondVolume: new FormControl('', [Validators.required]),
    isSolarPowerAvailable: new FormControl('', [Validators.required]),
    motorCapacity: new FormControl('', [Validators.required]),
    additionalWaterSource: new FormControl(''),
    waterTestCertificateUrl: new FormControl(''),
    isSinglePhasePower: new FormControl('', [Validators.required]),
    isThreePhasePower: new FormControl('', [Validators.required]),
    //gridPowerUnAvailability: new FormControl(''),
    automationRoomSize: new FormControl('', [Validators.required]),
    //farmhouseNote: new FormControl(''),
    storageAreaNote: new FormControl('')
  });

  farm: Farm = {} as Farm;
  farmId: string = '';

  registerFarm(){
    if (this.farmRegistrationForm.valid) {
      this.farm = {
        farmId: Date.now().toString(),
        farmName: this.farmRegistrationForm.get('farmName')?.value,
        surveyNumber: this.farmRegistrationForm.get('surveyNumber')?.value,
        address: this.farmRegistrationForm.get('address')?.value,
        shadeNetArea: Number(this.farmRegistrationForm.get('shadeNetArea')?.value ?? undefined),
        //geoTag: this.farmRegistrationForm.get('geoTag')?.value,
        farmPondVolume: Number(this.farmRegistrationForm.get('farmPondVolume')?.value ?? undefined),
        isSolarPowerAvailable: Boolean(this.farmRegistrationForm.get('isSolarPowerAvailable')?.value ?? undefined),
        motorCapacity: Number(this.farmRegistrationForm.get('motorCapacity')?.value ?? undefined),
        additionalWaterSource: this.farmRegistrationForm.get('additionalWaterSource')?.value,
        waterTestCertificateUrl: this.farmRegistrationForm.get('waterTestCertificateUrl')?.value,
        isSinglePhasePower: Boolean(this.farmRegistrationForm.get('isSinglePhasePower')?.value ?? undefined),
        isThreePhasePower: Boolean(this.farmRegistrationForm.get('isThreePhasePower')?.value ?? undefined),
        //gridPowerUnAvailability: this.farmRegistrationForm.get('gridPowerUnAvailability')?.value,
        automationRoomSize: Number(this.farmRegistrationForm.get('automationRoomSize')?.value ?? undefined),
        //farmhouseNote: this.farmRegistrationForm.get('farmhouseNote')?.value,
        storageAreaNote: this.farmRegistrationForm.get('storageAreaNote')?.value
      };
      console.log(this.farmRegistrationForm.value);

      this.farmRegistrationService.registerFarm(this.farm).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          this.farmId = response.FarmId;
          console.log('Farm ID:', this.farmId);
          // Inject Router in constructor first, then use:
          this.router.navigate(['/farm-owner-registration', this.farmId]);
        },
        error: (error) => {
          console.error('Registration failed', error);
        }}
      );
    }

    // Inject Router in constructor first, then use:
    //this.router.navigate(['/farm-owner-registration']);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    console.log('Selected file:', file);
    // You can implement file upload logic here
  }

  handleFileUploaded(data: any): void {
        console.log('File uploaded successfully in other component!', data);
        // Process the uploaded file data received from the file-upload component
      }
}
