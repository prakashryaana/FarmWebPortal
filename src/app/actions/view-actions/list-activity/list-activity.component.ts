// components/list-activity/list-activity.component.ts
import { Component, Input, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { NgIf, NgFor, DatePipe, AsyncPipe, TitleCasePipe } from '@angular/common';
import { ActivityService } from './activity.service';
import { Activity } from './activity.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { CropFarmSelectorService } from '../../../crop-farm-selector/crop-farm-selector.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

export interface GroupedActivity {
  rowType: 'group';
  date: string;
  types: string;
  messages: string;
  originalRecords: Activity[];
  isExpanded: boolean;
}

export interface DetailActivity {
  rowType: 'detail';
  data: Activity;
}

export type TableRow = GroupedActivity | DetailActivity;

@Component({
  selector: 'app-list-activity',
  standalone: true,
  imports: [DatePipe, MatListModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatButtonModule],
  templateUrl: './list-activity.component.html',
  styleUrls: ['./list-activity.component.css']
})
export class ListActivityComponent {
  @Input() cropId!: string;

  private activityService = inject(ActivityService);

  displayedColumns: string[] = ['expand', 'createdAt', 'activityType', 'message'];
  dataSource = new MatTableDataSource<TableRow>([]);
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

  private loadActivities(cropId: string): void {
    this.loading = true;

    this.activityService.getByCrop(cropId).subscribe({
      next: (activities) => {
        const grouped = this.groupByDate(activities);
        this.dataSource.data = this.flattenRows(grouped);
        this.loading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.loading = false;
      },
    });
  }

  private flattenRows(grouped: GroupedActivity[]): TableRow[] {
    const flattened: TableRow[] = [];
    grouped.forEach(group => {
      flattened.push(group);
      if (group.isExpanded) {
        group.originalRecords.forEach(record => {
          flattened.push({ rowType: 'detail', data: record });
        });
      }
    });
    return flattened;
  }

  private groupByDate(activities: Activity[]): GroupedActivity[] {
    // Sort activities by date ascending
    const sorted = [...activities].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Group by date (yyyy-MM-dd)
    const grouped: { [key: string]: Activity[] } = {};
    
    sorted.forEach(activity => {
      const date = new Date(activity.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    // Convert to GroupedActivity array
    return Object.entries(grouped).map(([date, records]) => ({
      rowType: 'group' as const,
      date,
      types: this.concatenateTypes(records),
      messages: this.concatenateMessages(records),
      originalRecords: records,
      isExpanded: false
    }));
  }

  private concatenateTypes(activities: Activity[]): string {
    const types = activities.map(a => a.activityType).join(', ');
    return types.length > 20 ? types.substring(0, 17) + '...' : types;
  }

  private concatenateMessages(activities: Activity[]): string {
    const messages = activities.map(a => a.message).join(', ');
    return messages.length > 20 ? messages.substring(0, 17) + '...' : messages;
  }

  toggleExpand(group: GroupedActivity): void {
    group.isExpanded = !group.isExpanded;
    // Refresh flattened data
    const grouped = this.dataSource.data.filter(r => r.rowType === 'group') as GroupedActivity[];
    this.dataSource.data = this.flattenRows(grouped);
  }

  getFullTypeList(group: GroupedActivity): string {
    return group.originalRecords.map(r => r.activityType).join(', ');
  }

  getFullMessageList(group: GroupedActivity): string {
    return group.originalRecords.map(r => r.message).join(', ');
  }

  isDetailRow(row: TableRow): boolean {
    return row.rowType === 'detail';
  }

  isGroupRow(row: TableRow): boolean {
    return row.rowType === 'group';
  }
}