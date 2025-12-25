import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AddActivityComponent } from './add-activity/add-activity.component';
import { CropFarmSelectorService } from '../../crop-farm-selector/crop-farm-selector.service';
import { inject } from '@angular/core';
import { AddObservationComponent } from './add-observation/add-observation.component';

export type ActionMode = 'activity' | 'observation';

@Component({
  selector: 'app-add-actions',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatCardModule,
    AddActivityComponent, AddObservationComponent],
  templateUrl: './add-actions.component.html',
  styleUrls: ['./add-actions.component.css']
})
export class AddActionsComponent {
  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  get selectedCropName(){ return this.cropFarmSelector.selectedCropName(); }
  
  readonly currentMode = signal<ActionMode>('activity'); // Default to activity
  
  //readonly selectedCropName = this.cropFarmSelector.selectedCropName();

  
  
  setMode(mode: ActionMode): void {
    this.currentMode.set(mode);
  }
}
