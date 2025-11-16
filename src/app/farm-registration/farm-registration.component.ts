import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-farm-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './farm-registration.component.html',
  styleUrl: './farm-registration.component.css',
})
export class FarmRegistrationComponent {
  constructor(private router: Router) {}

  farmRegistrationForm = new FormGroup({
    farmName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    sizeInSqrMtrs: new FormControl('', [Validators.required]),
    //soilType: new FormControl('', [Validators.required]),
    gpsLocation: new FormControl(''),
  })

  registerFarm(){
    console.log(this.farmRegistrationForm.value);
    // Inject Router in constructor first, then use:
    this.router.navigate(['maintainer-registration']);
  }
}
