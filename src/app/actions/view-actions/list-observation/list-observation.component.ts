import { Component, inject, effect } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ObservationService, Observation } from '../../add-actions/add-observation/observation.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CropFarmSelectorService } from '../../../crop-farm-selector/crop-farm-selector.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FileServerService } from '../../../file-upload/file-server.service';

export interface GroupedObservation {
  rowType: 'group';
  date: string;
  types: string;
  uniqueTypes: string[];
  messages: string;
  originalRecords: Observation[];
  isExpanded: boolean;
}

export interface DetailObservation {
  rowType: 'detail';
  data: Observation;
}

export type TableRow = GroupedObservation | DetailObservation;

@Component({
  selector: 'app-list-observation',
  standalone: true,
  imports: [DatePipe, MatTableModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  templateUrl: './list-observation.component.html',
  styleUrls: ['./list-observation.component.css']
})
export class ListObservationComponent {
  private readonly observationService = inject(ObservationService);
  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  private readonly fileServerService = inject(FileServerService);
  private readonly sanitizer = inject(DomSanitizer);

  displayedColumns: string[] = ['createdAt', 'observationType', 'message', 'attachments'];
  dataSource = new MatTableDataSource<TableRow>([]);
  loading = false;

  // Image popup properties
  selectedImage: SafeUrl | null = null;
  showImagePopup = false;

  // Audio popup properties
  selectedAudioUrl: SafeUrl | null = null;
  showAudioPopup = false;

  constructor() {
    effect(() => {
      const selection = this.cropFarmSelector.selectedCropFarm();
      const cropId = selection?.cropId;

      if (!cropId) {
        this.dataSource.data = [];
        return;
      }

      this.loadObservations(cropId);
    });
  }

  private loadObservations(cropId: string): void {
    this.loading = true;
    this.observationService.getByCrop(cropId).subscribe({
      next: (items) => {
        console.log('Observations: ', items);
        const grouped = this.groupByDate(items || []);
        this.dataSource.data = this.flattenRows(grouped);
        this.loading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.loading = false;
      }
    });
  }

  private flattenRows(grouped: GroupedObservation[]): TableRow[] {
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

  private groupByDate(observations: Observation[]): GroupedObservation[] {
    // Sort observations by date descending
    const sorted = [...observations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Group by date (yyyy-MM-dd)
    const grouped: { [key: string]: Observation[] } = {};
    
    sorted.forEach(observation => {
      const date = new Date(observation.createdAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateKey = `${day}/${month}/${year}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(observation);
    });

    // Convert to GroupedObservation array and sort groups descending by date
    return Object.entries(grouped).map(([date, records]) => ({
      rowType: 'group' as const,
      date,
      types: this.concatenateTypes(records),
      uniqueTypes: Array.from(new Set(records.map(r => r.observationType))),
      messages: this.concatenateMessages(records),
      originalRecords: records,
      isExpanded: false
    })).sort((a, b) => 
      new Date(b.originalRecords[0].createdAt).getTime() - new Date(a.originalRecords[0].createdAt).getTime()
    );
  }

  private concatenateTypes(observations: Observation[]): string {
    return observations.map(o => o.observationType).join(', ');
  }

  private concatenateMessages(observations: Observation[]): string {
    return observations.map(o => o.message || '').filter(m => m).join(', ');
  }

  toggleExpand(group: GroupedObservation): void {
    group.isExpanded = !group.isExpanded;
    const grouped = this.dataSource.data.filter(r => r.rowType === 'group') as GroupedObservation[];
    this.dataSource.data = this.flattenRows(grouped);
  }

  onRowClick(row: TableRow): void {
    if (this.isGroupRow(row)) {
      const group = row as GroupedObservation;
      if (group.originalRecords.length > 1) {
        this.toggleExpand(group);
      }
    }
  }

  getFullTypeList(group: GroupedObservation): string {
    return group.originalRecords.map(r => r.observationType).join(', ');
  }

  getFullMessageList(group: GroupedObservation): string {
    return group.originalRecords.map(r => r.message || '').filter(m => m).join(', ');
  }

  isDetailRow(row: TableRow): row is DetailObservation {
    return row.rowType === 'detail';
  }

  isGroupRow(row: TableRow): row is GroupedObservation {
    return row.rowType === 'group';
  }

  /**
   * Checks if an observation has an image
   */
  hasImage(imageUrl: string | null | undefined): boolean {
    return imageUrl != null && imageUrl.trim() !== '';
  }

  /**
   * Checks if an observation has an audio file
   */
  hasAudio(voiceNoteUrl: string | null | undefined): boolean {
    return voiceNoteUrl != null && voiceNoteUrl.trim() !== '';
  }

  /**
   * Gets the count of images attached to a row
   * @param row The table row
   * @returns Number of images
   */
  getImageCount(row: TableRow): number {
    if (this.isDetailRow(row)) {
      return this.hasImage(row.data.imageUrl) ? 1 : 0;
    } else if (this.isGroupRow(row)) {
      return row.originalRecords.filter(r => this.hasImage(r.imageUrl)).length;
    }
    return 0;
  }

  /**
   * Gets the count of audios attached to a row
   * @param row The table row
   * @returns Number of audios
   */
  getAudioCount(row: TableRow): number {
    if (this.isDetailRow(row)) {
      return this.hasAudio(row.data.voiceNoteUrl) ? 1 : 0;
    } else if (this.isGroupRow(row)) {
      return row.originalRecords.filter(r => this.hasAudio(r.voiceNoteUrl)).length;
    }
    return 0;
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
   * Opens the audio popup
   * @param voiceNoteUrl The local file path of the audio
   */
  openAudioPopup(voiceNoteUrl: string): void {
    const apiUrl = this.fileServerService.getImageUrl(voiceNoteUrl);
    if (apiUrl) {
      this.selectedAudioUrl = this.sanitizer.bypassSecurityTrustUrl(apiUrl);
      this.showAudioPopup = true;
    }
  }

  /**
   * Closes the audio popup
   */
  closeAudioPopup(): void {
    this.showAudioPopup = false;
    this.selectedAudioUrl = null;
  }
}
