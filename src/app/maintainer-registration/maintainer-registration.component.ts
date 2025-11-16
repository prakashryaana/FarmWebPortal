import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maintainer-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './maintainer-registration.component.html',
  styleUrl: './maintainer-registration.component.css',
})
export class MaintainerRegistrationComponent {
  maintainerRegistrationForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    contactNumber: new FormControl('', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    alternateContactNumber: new FormControl('', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]),
    role: new FormControl('', [Validators.required]),
    //email: new FormControl('', [Validators.required, Validators.email]),
    identityProofDocument: new FormControl('', [Validators.required]),
    identityProofNumber: new FormControl('', [Validators.required])
  })

}
