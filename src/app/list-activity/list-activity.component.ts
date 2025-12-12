// components/list-activity/list-activity.component.ts
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, AsyncPipe, TitleCasePipe } from '@angular/common';
import { ActivityService } from './activity.service';
import { Activity } from './activity.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { CropFarmSelectorService } from '../crop-farm-selector/crop-farm-selector.service';

@Component({
  selector: 'app-list-activity',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, MatListModule, MatIconModule, MatProgressSpinnerModule, AsyncPipe, TitleCasePipe],
  templateUrl: './list-activity.component.html',
  styleUrls: ['./list-activity.component.css']
})
export class ListActivityComponent implements OnChanges {


  private activityService = inject(ActivityService);
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
  @Input() cropId: string = this.cropFarmSelector.selectedCropId();

  constructor() {
    // Initial load if cropId is already set
    this.cropId = this.cropFarmSelector.selectedCropId() || '';
    if (this.cropId) {
      this.activities$ = this.activityService.getByCrop(this.cropId);
      console.log('ListActivityComponent initialized :', this.activities$);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cropId'] && this.cropId) {
      this.activities$ = this.activityService.getByCrop(this.cropId);
    }
  }

  iconFor(type: Activity['activityType']): string {
    switch (type) {
      case 'watering': return 'water_drop';
      case 'spraying': return 'spray_can';   // choose an icon you have
      case 'fertilizing': return 'science';
      case 'weeding': return 'yard';
      default: return 'event_note';
    }
  }
}
