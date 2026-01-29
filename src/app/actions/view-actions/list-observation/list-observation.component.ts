import { Component, inject, effect } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ObservationService, Observation } from '../../add-actions/add-observation/observation.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CropFarmSelectorService } from '../../../crop-farm-selector/crop-farm-selector.service';

export interface GroupedObservation {
  rowType: 'group';
  date: string;
  types: string;
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

  displayedColumns: string[] = ['expand', 'createdAt', 'observationType', 'message'];
  dataSource = new MatTableDataSource<TableRow>([]);
  loading = false;

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
    // Sort observations by date ascending
    const sorted = [...observations].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Group by date (yyyy-MM-dd)
    const grouped: { [key: string]: Observation[] } = {};
    
    sorted.forEach(observation => {
      const date = new Date(observation.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(observation);
    });

    // Convert to GroupedObservation array
    return Object.entries(grouped).map(([date, records]) => ({
      rowType: 'group' as const,
      date,
      types: this.concatenateTypes(records),
      messages: this.concatenateMessages(records),
      originalRecords: records,
      isExpanded: false
    }));
  }

  private concatenateTypes(observations: Observation[]): string {
    const types = observations.map(o => o.observationType).join(', ');
    return types.length > 20 ? types.substring(0, 17) + '...' : types;
  }

  private concatenateMessages(observations: Observation[]): string {
    const messages = observations.map(o => o.message || '').filter(m => m).join(', ');
    return messages.length > 20 ? messages.substring(0, 17) + '...' : messages;
  }

  toggleExpand(group: GroupedObservation): void {
    group.isExpanded = !group.isExpanded;
    const grouped = this.dataSource.data.filter(r => r.rowType === 'group') as GroupedObservation[];
    this.dataSource.data = this.flattenRows(grouped);
  }

  getFullTypeList(group: GroupedObservation): string {
    return group.originalRecords.map(r => r.observationType).join(', ');
  }

  getFullMessageList(group: GroupedObservation): string {
    return group.originalRecords.map(r => r.message || '').filter(m => m).join(', ');
  }

  isDetailRow(row: TableRow): boolean {
    return row.rowType === 'detail';
  }

  isGroupRow(row: TableRow): boolean {
    return row.rowType === 'group';
  }
}
