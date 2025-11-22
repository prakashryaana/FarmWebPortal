import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FarmOwnerRegistrationService } from './farm-owner-registration.service';
import { FarmOwner } from './farm-owner';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-farm-owner-registration',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farm-owner-registration.component.html',
  styleUrl: './farm-owner-registration.component.css',
})
export class FarmOwnerRegistrationComponent {
  //farmOwnerRegistrationService: FarmOwnerRegistrationService = inject(FarmOwnerRegistrationService);
  constructor(private router: Router, private farmOwnerRegistrationService: FarmOwnerRegistrationService) {}

  farmOwnerRegistrationForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    contactNumber: new FormControl('', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    alternateContactNumber: new FormControl('', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    emailId: new FormControl('', [Validators.required, Validators.email]),
    identityProofDocument: new FormControl('', [Validators.required]),
    identityProofNumber: new FormControl('', [Validators.required])
  });

  farmOwner: FarmOwner = {} as FarmOwner;

  registerFarmOwner() {
    if (this.farmOwnerRegistrationForm.valid) {
      this.farmOwner = {
        ownerId: Date.now().toString(),
        ownerName: this.farmOwnerRegistrationForm.get('fullName')?.value,
        contactNumber: this.farmOwnerRegistrationForm.get('contactNumber')?.value,
        alternateContactNumber: this.farmOwnerRegistrationForm.get('alternateContactNumber')?.value,
        address: this.farmOwnerRegistrationForm.get('address')?.value,
        emailId: this.farmOwnerRegistrationForm.get('emailId')?.value,
        identityProofDocument: this.farmOwnerRegistrationForm.get('identityProofDocument')?.value,
        identityProofNumber: this.farmOwnerRegistrationForm.get('identityProofNumber')?.value
      };
      console.log(this.farmOwner);

      this.farmOwnerRegistrationService.registerFarmOwner(this.farmOwner).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
        },
        error: (error) => {
          console.error('Registration failed', error);
        }}
      );
    }
    
    // Inject Router in constructor first, then use:
    this.router.navigate(['/farm-registration']);
  }
}