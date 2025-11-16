import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FarmOwner } from './farm-owner';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-farm-owner-registration',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farm-owner-registration.component.html',
  styleUrl: './farm-owner-registration.component.css',
})
export class FarmOwnerRegistration {
  constructor(private router: Router) {}

  farmOwnerRegistrationForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    contactNumber: new FormControl('', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    alternateContactNumber: new FormControl('', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    //email: new FormControl('', [Validators.required, Validators.email]),
    identityProofDocument: new FormControl('', [Validators.required]),
    identityProofNumber: new FormControl('', [Validators.required])
  })

  registerFarmOwner() {
    console.log(this.farmOwnerRegistrationForm.value);
    // Inject Router in constructor first, then use:
    this.router.navigate(['/farm-registration']);
  }
}