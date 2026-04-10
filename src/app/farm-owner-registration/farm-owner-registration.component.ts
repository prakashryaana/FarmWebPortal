import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FarmOwnerRegistrationService } from './farm-owner-registration.service';
import { FarmOwner } from './farm-owner';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-farm-owner-registration',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, FileUploadComponent],
  templateUrl: './farm-owner-registration.component.html',
  styleUrl: './farm-owner-registration.component.css',
})
export class FarmOwnerRegistrationComponent implements OnInit {
  isHealthReportUploaded: boolean = false;
  constructor(private router: Router, private route: ActivatedRoute, private farmOwnerRegistrationService: FarmOwnerRegistrationService) {}

  private snackBar = inject(MatSnackBar);

  // farmIdParam: string = '';
  // maintainerIdParam: string = '';

  ngOnInit() {
    // this.route.queryParams.subscribe(params => {
    //   this.farmIdParam = params['farmId'];
    //   this.maintainerIdParam = params['maintainerId'];
    // });
    // console.log('Farm ID from query params:', this.farmIdParam);
    // console.log('Maintainer ID from query params:', this.maintainerIdParam);
  }

  farmOwnerRegistrationForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    contactNumber: new FormControl('', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    alternateContactNumber: new FormControl('', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    emailId: new FormControl('', [Validators.required, Validators.email]),
    identityProofDocument: new FormControl('', [Validators.required]),
    identityProofNumber: new FormControl('', [Validators.required]),
    healthReportUrl: new FormControl(''),
  });

  farmOwner: FarmOwner = {} as FarmOwner;

  registerFarmOwner() {
    // if (!this.isHealthReportUploaded && !this.farmOwnerRegistrationForm.get('healthReportUrl')?.value) {
    //   this.snackBar.open('Health report is required', 'Close', { duration: 3000 });
    //   return;
    // }
    if (this.farmOwnerRegistrationForm.valid) {
      this.farmOwner = {
        ownerId: Date.now().toString(),
        // farmsOwned: [this.farmIdParam],
        // maintainers: [this.maintainerIdParam],
        ownerName: this.farmOwnerRegistrationForm.get('fullName')?.value,
        contactNumber: this.farmOwnerRegistrationForm.get('contactNumber')?.value,
        alternateContactNumber: this.farmOwnerRegistrationForm.get('alternateContactNumber')?.value,
        address: this.farmOwnerRegistrationForm.get('address')?.value,
        emailId: this.farmOwnerRegistrationForm.get('emailId')?.value,
        identityProofDocument: this.farmOwnerRegistrationForm.get('identityProofDocument')?.value,
        identityProofNumber: this.farmOwnerRegistrationForm.get('identityProofNumber')?.value,
        healthChecks: [{
          healthReportUrl: this.farmOwnerRegistrationForm.get('healthReportUrl')?.value,
          createdAt: new Date().toISOString()
        }],
      };
      console.log(this.farmOwner);

      this.farmOwnerRegistrationService.registerFarmOwner(this.farmOwner).subscribe({
        next: (response) => {
          console.log('Farm Owner Registration successful', response);
          this.snackBar.open('Farm Owner Registration successful!', 'Close', { duration: 5000 });
          this.reset();
        },
        error: (error) => {
          console.error('Farm Owner Registration failed', error);
          this.snackBar.open(`Farm Owner Registration failed - ${error.error.detail}`, 'Close', { duration: 5000 });
        }}
      );
    }
  }

  reset() {
    this.farmOwnerRegistrationForm.reset();
    this.isHealthReportUploaded = false;
  }

  handleHealthReportUploaded(data: any): void {
    console.log('Health report uploaded successfully in farm owner component!', data);
    this.isHealthReportUploaded = true;
    this.farmOwnerRegistrationForm.get('healthReportUrl')?.setValue(data.fullPath);
    // Process the uploaded file data received from the file-upload component
  }
}