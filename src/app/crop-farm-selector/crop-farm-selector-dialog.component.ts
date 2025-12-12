import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CropFarmSelectorService, CropOption } from './crop-farm-selector.service';

@Component({
  selector: 'app-crop-farm-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './crop-farm-selector-dialog.component.html',
  styleUrls: ['./crop-farm-selector-dialog.component.css']
})
export class CropFarmSelectorDialogComponent implements OnInit, OnDestroy {
  searchForm!: FormGroup;
  searchResults: CropOption[] = [];
  isLoading = false;
  displayedColumns: string[] = ['farmName', 'farmId', 'cropName', 'cropId', 'action'];
  private destroy$ = new Subject<void>();
  private searchQuery$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private selectorService: CropFarmSelectorService,
    public dialogRef: MatDialogRef<CropFarmSelectorDialogComponent>
  ) {
    this.searchForm = this.fb.group({
      searchQuery: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Setup debounced search
    this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.trim().length > 1) {
        this.performSearch(query);
      } else {
        this.searchResults = [];
      }
    });

    // Subscribe to search results from service
    this.selectorService.getSearchResults()
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.searchResults = results;
        this.isLoading = false;
      });

    // Listen to form value changes
    this.searchForm.get('searchQuery')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.searchQuery$.next(value);
      });
  }

  performSearch(query: string): void {
    this.isLoading = true;
    // Use the observable directly and subscribe with modern error handling
    this.selectorService.searchCropFarm(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isLoading = false;
          this.searchResults = [];
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  selectCropFarm(option: CropOption): void {
    this.selectorService.selectCropFarm(option);
    this.dialogRef.close(option);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
