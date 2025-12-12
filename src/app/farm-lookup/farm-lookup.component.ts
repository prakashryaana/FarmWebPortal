import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FarmService } from './farm-service'; // Your service
import { FarmPartial } from './farm-service';
import { MatRadioButton } from '@angular/material/radio';


@Component({
  selector: 'app-farm-lookup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioButton
  ],
  templateUrl: './farm-lookup.component.html',
  styleUrls: ['./farm-lookup.component.scss']
})
export class FarmLookupComponent implements OnInit {
  farmLookupForm: FormGroup;
  isLoading = false;
  isFarmFound = false;
  isFarmNotFound = false;
  farmData: FarmPartial | null = null;
  searchTerm = '';
  foundFarms: FarmPartial[] = [];

  @Input() farmOwnerId: string = '';
  selectedFarmData: FarmPartial = {} as FarmPartial;
  @Output() selectedFarm: EventEmitter<FarmPartial> = new EventEmitter<FarmPartial>();

  constructor(
    private fb: FormBuilder,
    private farmService: FarmService
  ) {
    this.farmLookupForm = this.fb.group({
      farmIdentifier: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {}

  onInputChange() {
    // Reset states when user types
    this.resetStates();
  }

  async lookupFarm() {
    if (this.farmLookupForm.invalid) return;

    this.isLoading = true;
    this.resetStates();
    this.searchTerm = this.farmLookupForm.get('farmIdentifier')?.value?.trim();

    try {
      this.farmService.getPartialFarmByIdOrName(this.searchTerm).subscribe({
        next: (data) => {
          if(data.length > 0){
            console.log('Lookup success:', data);
            this.foundFarms = data;
            //this.farmData = data;
            this.isFarmFound = true;
          } else {
            this.isFarmNotFound = true;
          }
        },
        error: (err) => {
          console.error('Lookup error:', err);
          this.isFarmNotFound = true;
        }
      });
      
    } catch (error) {
      console.error('Lookup error:', error);
      this.isFarmNotFound = true;
    } finally {
      this.isLoading = false;
    }
  }

  private resetStates() {
    this.isFarmFound = false;
    this.isFarmNotFound = false;
    this.farmData = null;
  }

  onFarmSelect(farm: FarmPartial) {
    this.selectedFarmData = farm;
    this.sendMessage();
  }

  sendMessage() {
    this.selectedFarm.emit(this.selectedFarmData);
  }
}
