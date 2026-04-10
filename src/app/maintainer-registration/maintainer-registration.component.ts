import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { Maintainer } from './maintainer';
import { MaintainerRegistrationService } from './maintainer-registration.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { EntitySearchComponent } from '../entity-search/entity-search.component';
import { FarmOwnerSearchResult, SearchResult } from '../entity-search/entity-search.service';

@Component({
  selector: 'app-maintainer-registration',
  imports: [ReactiveFormsModule, FileUploadComponent, MatFormFieldModule, MatIconModule, MatSelectModule, MatInputModule, EntitySearchComponent],
  templateUrl: './maintainer-registration.component.html',
  styleUrl: './maintainer-registration.component.css',
})
export class MaintainerRegistrationComponent {
  constructor(private router: Router, private route: ActivatedRoute, private maintainerRegistrationService: MaintainerRegistrationService) { }

  private snackBar = inject(MatSnackBar);

  //farmIdParam: string = '';
  selectedOwner: FarmOwnerSearchResult | null = null;

  onOwnerSelected(owner: SearchResult) {
    // Type guard: ensure it's a FarmOwner or FarmHelp (has contactNumber)
    console.log('Selected owner from search dialog:', owner);
    this.selectedOwner = owner as FarmOwnerSearchResult;
    // Proceed with registration using this owner's data
  }

  ngOnInit() {
  }

  farmMaintainerRegistrationForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    contactNumber: new FormControl('', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    alternateContactNumber: new FormControl('', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    education: new FormControl('', [Validators.required]),
    trainingCertificateUrl: new FormControl(''),
    healthReportUrl: new FormControl(''),
    identityProofDocument: new FormControl('', [Validators.required]),
    identityProofNumber: new FormControl('', [Validators.required])
  });
  isFileUploaded: boolean = false;
  isTrainingCertificateUploaded: boolean = false;
  isHealthReportUploaded: boolean = false;
  maintainer: Maintainer = {} as Maintainer;
  maintainerId: string = '';
  submitPressed: boolean = false;

  registerFarmMaintainer() {
    if (!this.submitPressed) {
      return;
    }
    this.submitPressed = false;
    if (!this.selectedOwner || !this.selectedOwner.id) {
        this.snackBar.open('Farm Owner selection is required', 'Close', { duration: 3000 });
        return;
    }
    if (!this.isTrainingCertificateUploaded && !this.farmMaintainerRegistrationForm.get('trainingCertificateUrl')?.value) {
      this.snackBar.open('Training certificate is required', 'Close', { duration: 3000 });
      return;
    }
    if (!this.isHealthReportUploaded && !this.farmMaintainerRegistrationForm.get('healthReportUrl')?.value) {
      this.snackBar.open('Health report is required', 'Close', { duration: 3000 });
      return;
    }
    if (this.farmMaintainerRegistrationForm.valid && this.selectedOwner && this.isTrainingCertificateUploaded && this.isHealthReportUploaded) {
      this.maintainer = {
        maintainerId: Date.now().toString(),
        maintainerName: this.farmMaintainerRegistrationForm.get('fullName')?.value,
        address: this.farmMaintainerRegistrationForm.get('address')?.value,
        trainingCertificateUrl: this.farmMaintainerRegistrationForm.get('trainingCertificateUrl')?.value,
        healthChecks: [{
          healthReportUrl: this.farmMaintainerRegistrationForm.get('healthReportUrl')?.value,
          createdAt: new Date().toISOString()
        }],
        contactNumber: this.farmMaintainerRegistrationForm.get('contactNumber')?.value,
        alternateContactNumber: this.farmMaintainerRegistrationForm.get('alternateContactNumber')?.value,
        education: this.farmMaintainerRegistrationForm.get('education')?.value,
        identityProofDocument: this.farmMaintainerRegistrationForm.get('identityProofDocument')?.value,
        identityProofNumber: this.farmMaintainerRegistrationForm.get('identityProofNumber')?.value,
        farmOwnerId: this.selectedOwner.id,
        //farmsMaintained: [this.farmIdParam]
      };
      console.log(this.farmMaintainerRegistrationForm.value);

      this.maintainerRegistrationService.registerMaintainer(this.maintainer).subscribe({
        next: (response) => {
          console.log('Maintainer Registration successful', response);
          this.snackBar.open('Maintainer Registration successful!', 'Close', { duration: 5000 });
          this.reset();
        },
        error: (error) => {
          console.error('Maintainer Registration failed', error);
          this.snackBar.open(`Maintainer Registration failed - ${error.error.detail}`, 'Close', { duration: 5000 });
        }
      }
      );
    }
  }

  reset() {
    this.farmMaintainerRegistrationForm.reset();
    this.isHealthReportUploaded = false;
    this.isTrainingCertificateUploaded = false;
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    console.log('Selected file:', file);
    // You can implement file upload logic here
  }

  handleTrainingCertificateUploaded(data: any): void {
    console.log('Training certificate uploaded successfully in maintainer component!', data);
    this.isTrainingCertificateUploaded = true;
    this.farmMaintainerRegistrationForm.get('trainingCertificateUrl')?.setValue(data.fullPath);
    // Process the uploaded file data received from the file-upload component
  }

  handleHealthReportUploaded(data: any): void {
    console.log('Health report uploaded successfully in maintainer component!', data);
    this.isHealthReportUploaded = true;
    this.farmMaintainerRegistrationForm.get('healthReportUrl')?.setValue(data.fullPath);
    // Process the uploaded file data received from the file-upload component
  }


}
