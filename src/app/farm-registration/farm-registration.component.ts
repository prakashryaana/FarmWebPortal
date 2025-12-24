import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateFarmDto } from './farm';
import { FarmRegistrationService } from './farm-registration.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { LocationComponent } from '../location/location.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { WeatherService } from '../farm-weather/weather.service';
import { Coordinates, GeolocationService } from '../location/geolocation.service';

@Component({
  selector: 'app-farm-registration',
  imports: [ReactiveFormsModule, FileUploadComponent, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatRadioModule, MatButtonModule, MatSlideToggle, LocationComponent],
  templateUrl: './farm-registration.component.html',
  styleUrl: './farm-registration.component.css',
})
export class FarmRegistrationComponent {
  constructor(private router: Router, private farmRegistrationService: FarmRegistrationService) {}

  private snackBar = inject(MatSnackBar);
  private weatherService = inject(WeatherService);
  private geoLocationService = inject(GeolocationService);

  coords:Coordinates;
  
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

  farm: CreateFarmDto = {} as CreateFarmDto;
  farmId: string = '';
  isFileUploaded: boolean = false;

  registerFarm(){
    console.log(this.weatherService.historicalWeatherData);
    console.log(this.geoLocationService.coordinates);
    console.log(this.weatherService.hasWeatherData());
    console.log(this.geoLocationService.hasLocationData());
    if (this.farmRegistrationForm.valid 
        && this.isFileUploaded 
        && this.weatherService.hasWeatherData() 
        && this.geoLocationService.hasLocationData()){
      this.farm = {
        farmId: Date.now().toString(),
        farmName: this.farmRegistrationForm.get('farmName')?.value,
        surveyNumber: this.farmRegistrationForm.get('surveyNumber')?.value,
        address: this.farmRegistrationForm.get('address')?.value,
        shadeNetArea: Number(this.farmRegistrationForm.get('shadeNetArea')?.value ?? undefined),
        geoLocation: {
          latitude: this.geoLocationService.coordinates().latitude,
          longitude: this.geoLocationService.coordinates().longitude
        },
        farmPondVolume: Number(this.farmRegistrationForm.get('farmPondVolume')?.value ?? undefined),
        isSolarPowerAvailable: Boolean(this.farmRegistrationForm.get('isSolarPowerAvailable')?.value ?? undefined),
        motorCapacity: this.farmRegistrationForm.get('motorCapacity')?.value,
        additionalWaterSource: this.farmRegistrationForm.get('additionalWaterSource')?.value,
        waterTestCertificateUrl: this.farmRegistrationForm.get('waterTestCertificateUrl')?.value,
        isSinglePhasePower: Boolean(this.farmRegistrationForm.get('isSinglePhasePower')?.value ?? undefined),
        isThreePhasePower: Boolean(this.farmRegistrationForm.get('isThreePhasePower')?.value ?? undefined),
        //gridPowerUnAvailability: this.farmRegistrationForm.get('gridPowerUnAvailability')?.value,
        automationRoomSize: Number(this.farmRegistrationForm.get('automationRoomSize')?.value ?? undefined),
        //farmhouseNote: this.farmRegistrationForm.get('farmhouseNote')?.value,
        storageAreaNote: this.farmRegistrationForm.get('storageAreaNote')?.value,
        historicalWeather: {
          startDate: this.weatherService.historicalWeatherData().startDate,
          endDate: this.weatherService.historicalWeatherData().endDate,
          rainyMonths: this.weatherService.historicalWeatherData().rainyMonths,
          winterMonths: this.weatherService.historicalWeatherData().winterMonths,
          monthly: this.weatherService.historicalWeatherData().monthly,
        }
      };
      console.log(this.farmRegistrationForm.value);
      console.log(this.farm);

      this.farmRegistrationService.registerFarm(this.farm).subscribe({
        next: (response) => {
          console.log('Farm Registration successful', response);
          this.farmId = response.farmId;
          // console.log('Farm ID:', this.farmId);
          this.snackBar.open('Farm Registration successful!', 'Close', { duration: 5000 });
          this.router.navigate(['/maintainer-registration', this.farmId]);
        },
        error: (error) => {
          console.error('Farm Registration failed', error);
          this.snackBar.open('Farm Registration failed. Please try again.', 'Close', { duration: 5000 });
        }}
      );
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    console.log('Selected file:', file);
    // You can implement file upload logic here
  }

  handleFileUploaded(data: any): void {
    console.log('File uploaded successfully in farm component!', data);
    this.isFileUploaded = true;
    this.farmRegistrationForm.get('waterTestCertificateUrl')?.setValue(data.fullPath);
    // Process the uploaded file data received from the file-upload component
  }
}
