import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CropRegistrationService } from './crop-registration.service';
import { Crop } from './crop';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { DDMMYYYY_DATE_FORMATS } from '../date-format';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { FarmLookupComponent } from "../farm-lookup/farm-lookup.component";
import { FarmService } from '../farm-lookup/farm-service';
import { UpdateFarmDto } from '../farm-registration/farm';
import { FarmPartial } from '../farm-lookup/farm-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';

@Component({
  selector: 'app-crop-registration',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule,
    MatDatepicker, MatDatepickerToggle, MatDatepickerInput, MatNativeDateModule, FarmLookupComponent],
  providers: [
        provideLuxonDateAdapter(DDMMYYYY_DATE_FORMATS),
        //  { provide: MAT_DATE_FORMATS, useValue: DDMMYYYY_DATE_FORMATS },
         { provide: MAT_DATE_LOCALE, useValue: 'en-GB' } // Optional: Set locale for dd/MM/yyyy
      ],
  templateUrl: './crop-registration.component.html',
  styleUrl: './crop-registration.component.css',
})
export class CropRegistrationComponent {
  constructor(private router: Router, private cropRegistrationService: CropRegistrationService, private farmService: FarmService) {}
  private snackBar = inject(MatSnackBar);

  cropRegistrationForm = new FormGroup({
    cropName: new FormControl('', [Validators.required]),
    area: new FormControl('', [Validators.required]),
    dateOfSowing: new FormControl(null, [Validators.required])
  });

  crop: Crop = {} as Crop;
  cropId: string = '';
  selectedFarm: FarmPartial = {} as FarmPartial;
  isFarmSelected: boolean = false;

  registerCrop(){
    // this.cropId = Date.now().toString();
    // this.router.navigate(['/home']);
    if (this.cropRegistrationForm.valid && this.isFarmSelected) {
      this.crop = {
        cropId: Date.now().toString(),
        cropName: this.cropRegistrationForm.get('cropName')?.value,
        cropArea: Number(this.cropRegistrationForm.get('area')?.value),
        dateOfSowing: this.cropRegistrationForm.get('dateOfSowing')?.value
      };
      console.log(this.cropRegistrationForm.value);

      /// Call the CropService to register the crop
      /// On successful registration, Fetch the selected Farm details
      /// Update the farm with new Crop ID and navigate to Home

      this.cropRegistrationService.registerCrop(this.crop).subscribe({
        next: (response) => {
          console.log('Crop Registration successful', response);
          this.snackBar.open('Crop Registration successful!', 'Close', { duration: 5000 });
          this.cropId = response.cropId;

          //Fetch Farm details
          this.farmService.getFarmById(this.selectedFarm.farmId).subscribe({
            next: (res) => {
              const farm: UpdateFarmDto = res;
              if (!farm.Crops) {
                farm.Crops = [];
              }
              farm.Crops.push(this.cropId);
              //Update Farm with new Crop ID
              this.farmService.updateFarm(this.selectedFarm.farmId, farm).subscribe({
                next: (res) => {
                  console.log('Updated Farm with Crop ID successfully', res);
                  this.snackBar.open('Farm updated with new Crop successfully!', 'Close', { duration: 5000 });
                },
                error: (err) => {
                  console.error('Failed to get Farm details for updating Crop ID', err);
                  this.snackBar.open('Failed to update Farm with new Crop. Please try again.', 'Close', { duration: 5000 });
                }
              });
            },
            error: (err) => {
              console.error('Failed to update Farm with Crop ID', err);
            }});

          this.router.navigate(['/home-dashboard']);
        },
        error: (error) => {
          console.error('Crop Registration failed', error);
          this.snackBar.open('Crop Registration failed. Please try again.', 'Close', { duration: 5000 });
        }}
      );
    }
  }

  onSelectedFarmEvent(farm: FarmPartial) {
    this.isFarmSelected = true;
    this.selectedFarm = farm;
    console.log('Selected Farm ID passed from Farm Lookup to Crop Registration:', this.selectedFarm.farmId);
  }
}
