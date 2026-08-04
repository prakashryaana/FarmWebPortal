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
import { MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FileServerService } from '../../../file-upload/file-server.service';

export interface GroupedActivity {
  rowType: 'group';
  date: string;
  types: string;
  uniqueTypes: string[];
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
  imports: [DatePipe, MatListModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatButtonModule, MatDialogModule],
  templateUrl: './list-activity.component.html',
  styleUrls: ['./list-activity.component.css']
})
export class ListActivityComponent {
  @Input() cropId!: string;

  private activityService = inject(ActivityService);
  private fileServerService = inject(FileServerService);
  private sanitizer = inject(DomSanitizer);

  displayedColumns: string[] = ['createdAt', 'activityType', 'message', 'image'];
  dataSource = new MatTableDataSource<TableRow>([]);
  loading = false;

  // Image popup properties
  selectedImage: SafeUrl | null = null;
  showImagePopup = false;

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
    // Sort activities by date descending
    const sorted = [...activities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Group by date (yyyy-MM-dd)
    const grouped: { [key: string]: Activity[] } = {};
    
    sorted.forEach(activity => {
      const date = new Date(activity.createdAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateKey = `${day}/${month}/${year}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    // Convert to GroupedActivity array and sort groups descending by date
    return Object.entries(grouped).map(([date, records]) => ({
      rowType: 'group' as const,
      date,
      types: this.concatenateTypes(records),
      uniqueTypes: Array.from(new Set(records.map(r => r.activityType))),
      messages: this.concatenateMessages(records),
      originalRecords: records,
      isExpanded: false
    })).sort((a, b) => 
      new Date(b.originalRecords[0].createdAt).getTime() - new Date(a.originalRecords[0].createdAt).getTime()
    );
  }

  private concatenateTypes(activities: Activity[]): string {
    return activities.map(a => a.activityType).join(', ');
  }

  private concatenateMessages(activities: Activity[]): string {
    return activities.map(a => a.message).join(', ');
  }

  toggleExpand(group: GroupedActivity): void {
    group.isExpanded = !group.isExpanded;
    // Refresh flattened data
    const grouped = this.dataSource.data.filter(r => r.rowType === 'group') as GroupedActivity[];
    this.dataSource.data = this.flattenRows(grouped);
  }

  onRowClick(row: TableRow): void {
    if (this.isGroupRow(row)) {
      const group = row as GroupedActivity;
      if (group.originalRecords.length > 1) {
        this.toggleExpand(group);
      }
    }
  }

  getFullTypeList(group: GroupedActivity): string {
    return group.originalRecords.map(r => r.activityType).join(', ');
  }

  getFullMessageList(group: GroupedActivity): string {
    return group.originalRecords.map(r => r.message).join(', ');
  }

  isDetailRow(row: TableRow): row is DetailActivity {
    return row.rowType === 'detail';
  }

  isGroupRow(row: TableRow): row is GroupedActivity {
    return row.rowType === 'group';
  }

  /**
   * Formats message to include productName and quantity in square brackets at the start
   * @param activity The activity record
   * @returns Formatted message string
   */
  formatMessage(activity: Activity): string {
    const details: string[] = [];
    
    if (activity.productName) {
      details.push(`Product: ${activity.productName}`);
    }
    
    if (activity.quantity) {
      details.push(`Qty: ${activity.quantity}`);
    }
    
    const prefix = details.length > 0 ? `[${details.join(', ')}] ` : '';
    return prefix + activity.message;
  }

  /**
   * Opens the image popup
   * @param imageUrl The local file path of the image
   */
  openImagePopup(imageUrl: string): void {
    const apiUrl = this.fileServerService.getImageUrl(imageUrl);
    if (apiUrl) {
      this.selectedImage = this.sanitizer.bypassSecurityTrustUrl(apiUrl);
      this.showImagePopup = true;
    }
  }

  /**
   * Closes the image popup
   */
  closeImagePopup(): void {
    this.showImagePopup = false;
    this.selectedImage = null;
  }

  /**
   * Checks if an image URL is valid (not null or blank)
   * @param imageUrl The URL to check
   * @returns True if imageUrl is valid
   */
  hasImage(imageUrl: string | null): boolean {
    return imageUrl != null && imageUrl.trim() !== '';
  }
}