import { Component, inject, effect } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ObservationService, Observation } from '../add-observation/observation.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CropFarmSelectorService } from '../crop-farm-selector/crop-farm-selector.service';

@Component({
  selector: 'app-list-observation',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, MatTableModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './list-observation.component.html',
  styleUrls: ['./list-observation.component.css']
})
export class ListObservationComponent {
  private readonly observationService = inject(ObservationService);
  private readonly cropFarmSelector = inject(CropFarmSelectorService);

  displayedColumns: string[] = ['createdAt', 'observationType', 'message'];
  dataSource = new MatTableDataSource<Observation>([]);
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
        this.dataSource.data = items || [];
        this.loading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.loading = false;
      }
    });
  }
}
