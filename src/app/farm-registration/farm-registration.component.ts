import { Component, computed, effect, signal } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, startWith, switchMap, distinctUntilChanged } from 'rxjs';
import { AddressService } from './address.service';
import { District, Hobli, State, SubDistrict, Taluka, Village } from './address.models';

@Component({
  selector: 'app-farm-registration',
  imports: [ReactiveFormsModule, FileUploadComponent, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatRadioModule, MatButtonModule, MatSlideToggle, LocationComponent, CommonModule, MatCheckboxModule, MatIconModule, MatButtonToggleModule, MatProgressSpinnerModule],
  templateUrl: './farm-registration.component.html',
  styleUrl: './farm-registration.component.css',
})
export class FarmRegistrationComponent {
  

  private snackBar = inject(MatSnackBar);
  private weatherService = inject(WeatherService);
  private geoLocationService = inject(GeolocationService);
  private addressService = inject(AddressService);

  farmOwnerIdParam: string = '';
  farmMaintainerIdParam: string = '';

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  coords:Coordinates;
  gridPowerSchedule: GridPowerUnavailability[] = [];

  // Signals
  pincode = signal('');
  isPincodeLoading = signal(false);
  states = signal<{ stateName: string; stateCode: number }[]>([]);
  districts = signal<any[]>([]);
  subDistricts = signal<any[]>([]);
  talukas = signal<any[]>([]);
  hoblis = signal<any[]>([]);
  villages = signal<any[]>([]);
  selectedState = signal<State|null>(null);

  isKarnataka = computed(() => {
    const selected = this.selectedState();
    if(selected) {
      console.log('Selected state :', selected);
      return selected.stateName.toLowerCase() === 'karnataka';
    }
    else
      return false;
  });

  showKarnatakaFields = computed(() => this.isKarnataka());
  showOtherStateFields = computed(() => !this.isKarnataka());
  
  farmRegistrationForm = new FormGroup({
    farmName: new FormControl('', [Validators.required]),
    
    pincode: new FormControl(''),
    state: new FormControl<State|null>(null),
    district: new FormControl<District|null>(null),
    subDistrict: new FormControl<SubDistrict|null>(null),
    taluka: new FormControl<Taluka|null>(null),
    hobli: new FormControl<Hobli|null>(null),
    village: new FormControl<Village|null>(null),
    surveyNumber: new FormControl(''),
    hissa: new FormControl(''),
    addressLine: new FormControl(''),

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

  constructor(private router: Router, private route: ActivatedRoute, private farmRegistrationService: FarmRegistrationService) {
    // Load states on init
    this.addressService.getAllStates().subscribe(states => {
      this.states.set(states);
    });

    // State change → cascade and update conditional validators
    this.farmRegistrationForm.get('state')?.valueChanges.subscribe(state => {
      this.selectedState.set(state || null);
      this.clearDependentFields();
      
      if (state) {
        if(this.isKarnataka()) {
          this.addressService.getKarnatakaDistricts().subscribe(districts => {
            this.districts.set(districts);
          });
        } else {
          this.addressService.getDistrictsByState(state.stateName).subscribe(districts => {
            this.districts.set(districts);
          });
        }
        
        // Update validators based on state
        this.updateValidators();
      }
    });

    // District change → load talukas or subDistricts
    this.farmRegistrationForm.get('district')?.valueChanges.subscribe(district => {
      if (district) {
        this.onDistrictChange(district);
      }
    });

    // Subdistrict/Taluka change → load hoblis
    this.farmRegistrationForm.get('subDistrict')?.valueChanges.subscribe(SubDistrict => {
      if (SubDistrict && !this.isKarnataka()) {
        this.onSubDistrictChange(SubDistrict);
      }
    });

    this.farmRegistrationForm.get('taluka')?.valueChanges.subscribe(taluka => {
      if (taluka && this.isKarnataka()) {
        const district = this.farmRegistrationForm.get('district')?.value;
        this.onTalukaChange(district, taluka);
      }
    });

    // Hobli change → load villages
    this.farmRegistrationForm.get('hobli')?.valueChanges.subscribe(hobli => {
      if (hobli && this.isKarnataka()) {
        const district = this.farmRegistrationForm.get('district')?.value;
        const taluka = this.farmRegistrationForm.get('taluka')?.value;
        this.onHobliChange(district, taluka, hobli);
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.farmOwnerIdParam = params['farmOwnerId'];
      this.farmMaintainerIdParam = params['farmMaintainerId'];
    });
    console.log('Farm Owner ID:', this.farmOwnerIdParam);
    console.log('Farm Maintainer ID:', this.farmMaintainerIdParam);
  }

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

  loadByPincode(pincode: string) {
    this.isPincodeLoading.set(true);
    this.addressService.getByPincode(pincode).subscribe({
      next: (hierarchy) => {
        this.farmRegistrationForm.patchValue({
          state: hierarchy.state.stateName,
          district: hierarchy.districts[0]?.districtNme,
          subDistrict: hierarchy.subDistricts[0]?.subDistrictName
        });
        this.selectedState.set(hierarchy.stateName || '');
        this.isPincodeLoading.set(false);
      },
      error: (err) => {
        console.error('Pincode lookup failed', err);
        this.isPincodeLoading.set(false);
      }
    });
  }

  clearDependentFields() {
    this.farmRegistrationForm.patchValue({
      district: null,
      subDistrict: null,
      taluka: null,
      hobli: null,
      village: null
    }, { emitEvent: false });
    this.districts.set([]);
    this.subDistricts.set([]);
    this.talukas.set([]);
    this.hoblis.set([]);
    this.villages.set([]);
  }

  updateValidators() {
    const subDistrictControl = this.farmRegistrationForm.get('subDistrict');
    const addressLineControl = this.farmRegistrationForm.get('addressLine');
    const talukaControl = this.farmRegistrationForm.get('taluka');
    const hobliControl = this.farmRegistrationForm.get('hobli');
    const surveyNumberControl = this.farmRegistrationForm.get('surveyNumber');
    const hissaControl = this.farmRegistrationForm.get('hissa');

    if (this.isKarnataka()) {
      // Karnataka: subDistrict and addressLine not required/hidden
      subDistrictControl?.clearAsyncValidators();
      subDistrictControl?.clearValidators();
      subDistrictControl?.updateValueAndValidity({ emitEvent: false });
      
      addressLineControl?.clearAsyncValidators();
      addressLineControl?.clearValidators();
      addressLineControl?.updateValueAndValidity({ emitEvent: false });
      
      talukaControl?.setValidators([Validators.required]);
      hobliControl?.setValidators([Validators.required]);
      surveyNumberControl?.setValidators([Validators.required]);
      hissaControl?.setValidators([Validators.required]);
    } else {
      // Other states: taluka, hobli, surveyNumber, hissa hidden/not required
      talukaControl?.clearAsyncValidators();
      talukaControl?.clearValidators();
      talukaControl?.updateValueAndValidity({ emitEvent: false });
      
      hobliControl?.clearAsyncValidators();
      hobliControl?.clearValidators();
      hobliControl?.updateValueAndValidity({ emitEvent: false });
      
      surveyNumberControl?.clearAsyncValidators();
      surveyNumberControl?.clearValidators();
      surveyNumberControl?.updateValueAndValidity({ emitEvent: false });
      
      hissaControl?.clearAsyncValidators();
      hissaControl?.clearValidators();
      hissaControl?.updateValueAndValidity({ emitEvent: false });
      
      // Other states: require subDistrict and addressLine
      subDistrictControl?.setValidators([Validators.required]);
      addressLineControl?.setValidators([Validators.required]);
    }

    talukaControl?.updateValueAndValidity({ emitEvent: false });
    hobliControl?.updateValueAndValidity({ emitEvent: false });
    surveyNumberControl?.updateValueAndValidity({ emitEvent: false });
    hissaControl?.updateValueAndValidity({ emitEvent: false });
    subDistrictControl?.updateValueAndValidity({ emitEvent: false });
    addressLineControl?.updateValueAndValidity({ emitEvent: false });
  }

  onPincodeChange(event: any) {
    const pincode = event.target.value;
    if (pincode && pincode.length === 6) {
      this.pincode.set(pincode);
    }
  }

  onDistrictChange(district: District) {
    //console.log('district:', district);
    if (this.isKarnataka()) {
      this.addressService.GetKarnatakaTalukasByDistrict(district.districtCode).subscribe({
        next: talukas => this.talukas.set(talukas),
        error: err => console.error('Error loading talukas', err)
      });
    } else {
      this.addressService.GetSubdistrictsByDistrict(district.districtCode).subscribe({
        next: subs => this.subDistricts.set(subs),
        error: err => console.error('Error loading subDistricts', err)
      });
    }
  }

  onSubDistrictChange(subDistrict: SubDistrict) {
    //console.log('subDistrict:', subDistrict);
    if (!this.isKarnataka()) {
      this.addressService.GetVillagesBySubDistrict(subDistrict.subDistrictName).subscribe(villages => this.villages.set(villages));
    }
  }

  onTalukaChange(district: District, taluka: Taluka) {
    //console.log('taluka:', taluka);
    if (this.isKarnataka()) {
      this.addressService.GeKarnatakatHoblisByDistrictAndTaluka(district.districtCode, taluka.talukaCode).subscribe({ 
        next: hoblis => this.hoblis.set(hoblis),
        error: err => console.error('Error loading hoblis', err)
      });
    }
  }

  onHobliChange(district: District, taluka: Taluka, hobli: Hobli) {
    //console.log('hobli:', hobli);
    if (this.isKarnataka()) {
      this.addressService.GetKarnatakaVillagesByDistrictAndTalukaAndHobli(district.districtCode, taluka.talukaCode, hobli.hobliCode).subscribe({
        next: villages => this.villages.set(villages),
        error: err => console.error('Error loading villages', err)
      });
    } 
  }

  registerFarm(){
    console.log(this.weatherService.historicalWeatherData);
    console.log(this.geoLocationService.coordinates);
    console.log(this.weatherService.hasWeatherData());
    console.log(this.geoLocationService.hasLocationData());
    if (this.farmRegistrationForm.valid 
        && this.farmOwnerIdParam 
        && this.farmMaintainerIdParam
        && this.isFileUploaded 
        && this.weatherService.hasWeatherData() 
        && this.geoLocationService.hasLocationData()){
      this.farm = {
        farmId: Date.now().toString(),
        farmName: this.farmRegistrationForm.get('farmName')?.value,
        surveyNumber: this.farmRegistrationForm.get('surveyNumber')?.value,
        farmOwnerId: this.farmOwnerIdParam,
        farmMaintainerId: this.farmMaintainerIdParam,
        
        address: this.isKarnataka() ? {
          pincode: this.farmRegistrationForm.get('pincode')?.value,
          state: this.farmRegistrationForm.get('state')?.value.stateName,
          district: this.farmRegistrationForm.get('district')?.value.districtName,
          taluka: this.farmRegistrationForm.get('taluka')?.value.talukaName,
          hobli: this.farmRegistrationForm.get('hobli')?.value.hobliName,
          village: this.farmRegistrationForm.get('village')?.value.villageName,
          surveyNumber: this.farmRegistrationForm.get('surveyNumber')?.value,
          hissa: this.farmRegistrationForm.get('hissa')?.value
        } : {
          pincode: this.farmRegistrationForm.get('pincode')?.value,
          state: this.farmRegistrationForm.get('state')?.value.stateName,
          district: this.farmRegistrationForm.get('district')?.value.districtName,
          subDistrict: this.farmRegistrationForm.get('subDistrict')?.value.subDistrictName,
          village: this.farmRegistrationForm.get('village')?.value.villageName,
          addressLine: this.farmRegistrationForm.get('addressLine')?.value,
        },

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
          this.router.navigate(['home-dashboard']);
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
