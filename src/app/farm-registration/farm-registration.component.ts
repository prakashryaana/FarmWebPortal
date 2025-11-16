import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-farm-registration',
  imports: [],
  templateUrl: './farm-registration.component.html',
  styleUrl: './farm-registration.component.css',
})
export class FarmRegistrationComponent {
  farmOwnerRegistrationForm = new FormGroup({
    farmName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    sizeInSqrMtrs: new FormControl('', [Validators.required]),
    //soilType: new FormControl('', [Validators.required]),
    gpsLocation: new FormControl(''),
  })
}
