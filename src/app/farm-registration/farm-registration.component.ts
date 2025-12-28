import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateFarmDto, GridPowerUnavailability, TimeRange } from './farm';
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
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-farm-registration',
  imports: [ReactiveFormsModule, FileUploadComponent, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatRadioModule, MatButtonModule, MatSlideToggle, LocationComponent, CommonModule, MatCheckboxModule, MatIconModule, MatButtonToggleModule],
  templateUrl: './farm-registration.component.html',
  styleUrl: './farm-registration.component.css',
})
export class FarmRegistrationComponent {
  constructor(private router: Router, private farmRegistrationService: FarmRegistrationService) {}

  private snackBar = inject(MatSnackBar);
  private weatherService = inject(WeatherService);
  private geoLocationService = inject(GeolocationService);

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  coords:Coordinates;
  gridPowerSchedule: GridPowerUnavailability[] = [];
  
  farmRegistrationForm = new FormGroup({
    farmName: new FormControl('', [Validators.required]),
    surveyNumber: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    shadeNetArea: new FormControl('', [Validators.required]),
    farmPondVolume: new FormControl('', [Validators.required]),
    isSolarPowerAvailable: new FormControl('', [Validators.required]),
    motorCapacity: new FormControl('', [Validators.required]),
    additionalWaterSource: new FormControl(''),
    waterTestCertificateUrl: new FormControl(''),
    isSinglePhasePower: new FormControl("false", [Validators.required]),
    isThreePhasePower: new FormControl("True", [Validators.required]),
    automationRoomSize: new FormControl('', [Validators.required]),
    farmhouseNote: new FormControl('', [Validators.maxLength(250)]),
    storageAreaNote: new FormControl('')
  });

  gridPowerForm = new FormGroup({
    selectedDay: new FormControl('', [Validators.required]),
    applyAllDays: new FormControl(false),
    timeRanges: new FormArray([
      new FormGroup({
        fromTime: new FormControl('', [Validators.required]),
        toTime: new FormControl('', [Validators.required])
      })
    ])
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
        //gridPowerUnAvailability: this.gridPowerSchedule,
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

  addTimeRange() {
    const timeRanges = this.gridPowerForm.get('timeRanges') as FormArray;
    timeRanges.push(new FormGroup({
      fromTime: new FormControl('', [Validators.required]),
      toTime: new FormControl('', [Validators.required])
    }));
  }

  removeTimeRange(index: number) {
    const timeRanges = this.gridPowerForm.get('timeRanges') as FormArray;
    timeRanges.removeAt(index);
  }

  addGridPowerSchedule() {
    if (!this.gridPowerForm.valid) {
      this.snackBar.open('Please fill all time range fields', 'Close', { duration: 3000 });
      return;
    }
    
    const selectedDay = this.gridPowerForm.get('selectedDay')?.value;
    const applyAllDays = this.gridPowerForm.get('applyAllDays')?.value;
    const timeRanges = (this.gridPowerForm.get('timeRanges') as FormArray).value;

    if (applyAllDays) {
      this.days.forEach(day => {
        const existing = this.gridPowerSchedule.findIndex(s => s.day === day);
        if (existing !== -1) {
          this.gridPowerSchedule[existing].timeRanges = [...timeRanges];
        } else {
          this.gridPowerSchedule.push({ day, timeRanges: [...timeRanges] });
        }
      });
      this.snackBar.open('Time ranges applied to all days', 'Close', { duration: 3000 });
    } else {
      const existing = this.gridPowerSchedule.findIndex(s => s.day === selectedDay);
      if (existing !== -1) {
        this.gridPowerSchedule[existing].timeRanges = [...timeRanges];
        this.snackBar.open('Time ranges updated for ' + selectedDay, 'Close', { duration: 3000 });
      } else {
        this.gridPowerSchedule.push({ day: selectedDay, timeRanges: [...timeRanges] });
        this.snackBar.open('Time ranges added for ' + selectedDay, 'Close', { duration: 3000 });
      }
    }
    
    this.resetGridPowerForm();
  }

  deleteGridPowerSchedule(day: string) {
    this.gridPowerSchedule = this.gridPowerSchedule.filter(s => s.day !== day);
    this.snackBar.open('Removed schedule for ' + day, 'Close', { duration: 3000 });
  }

  resetGridPowerForm() {
    this.gridPowerForm.reset({ applyAllDays: false, selectedDay: '', timeRanges: [{ fromTime: '', toTime: '' }] });
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
