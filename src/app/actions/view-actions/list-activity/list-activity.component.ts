// components/list-activity/list-activity.component.ts
import { Component, Input, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { NgIf, NgFor, DatePipe, AsyncPipe, TitleCasePipe } from '@angular/common';
import { ActivityService } from './activity.service';
import { Activity } from './activity.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { CropFarmSelectorService } from '../../../crop-farm-selector/crop-farm-selector.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-list-activity',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, MatListModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './list-activity.component.html',
  styleUrls: ['./list-activity.component.css']
})
export class ListActivityComponent {
  @Input() cropId!: string;

  private activityService = inject(ActivityService);

  displayedColumns: string[] = ['createdAt', 'activityType', 'message'];
  dataSource = new MatTableDataSource<Activity>([]);
  loading = false;

  activities$!: Observable<Activity[]>;

  //#region gets the global selected crop farm
  // inject the service
  private readonly cropFarmSelector = inject(CropFarmSelectorService);

  // convenient getter for template / code
  get selectedCropFarm() {
    return this.cropFarmSelector.selectedCropFarm(); // SelectedCropFarm | null
  }

  // If you want direct ids/names:
  get selectedFarmId()  { return this.cropFarmSelector.selectedFarmId(); }
  get selectedCropId()  { 
    return this.cropId = this.cropFarmSelector.selectedCropId(); }
  get selectedFarmName(){ return this.cropFarmSelector.selectedFarmName(); }
  get selectedCropName(){ return this.cropFarmSelector.selectedCropName(); }
  //#endregion gets the global selected crop farm

  constructor() {
    // React to changes in selected crop via signal
    effect(() => {
      const selection = this.cropFarmSelector.selectedCropFarm();
      const cropId = selection?.cropId;

      if (!cropId) {
        this.dataSource.data = [];
        return;
      }

      this.loadActivities(cropId);
    });
  }


  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['cropId'] && this.cropId) {
  //     this.loadActivities();
  //   }
  // }

  private loadActivities(cropId: string): void {
    this.loading = true;

    this.activityService.getByCrop(cropId).subscribe({
      next: (activities) => {
        this.dataSource.data = activities;
        this.loading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.loading = false;
      },
    });
  }
}