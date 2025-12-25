import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ListActivityComponent } from './list-activity/list-activity.component';
import { ListObservationComponent } from './list-observation/list-observation.component';
import { CropFarmSelectorService } from '../../crop-farm-selector/crop-farm-selector.service';
import { ActivityService } from './list-activity/activity.service';
import { ObservationService } from '../add-actions/add-observation/observation.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-view-actions',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, ListActivityComponent, ListObservationComponent],
  templateUrl: './view-actions.component.html',
  styleUrls: ['./view-actions.component.css']
})
export class ViewActionsComponent {
  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  private readonly activityService = inject(ActivityService);
  private readonly observationService = inject(ObservationService);

  get selectedCropName() { return this.cropFarmSelector.selectedCropName(); }
  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }

  async generateReport(): Promise<void> {
    const selection = this.cropFarmSelector.selectedCropFarm();
    if (!selection) {
      alert('Please select a farm and crop first.');
      return;
    }

    const cropId = selection.cropId;

    // fetch activities and observations
    const activities = await firstValueFrom(this.activityService.getByCrop(cropId));
    const observations = await firstValueFrom(this.observationService.getByCrop(cropId));

    const html = this.buildReportHtml(selection.farmName, selection.cropName, activities, observations);

    // Word
    const wordBlob = new Blob([html], { type: 'application/msword' });
    this.triggerDownload(wordBlob, `${selection.farmName}_${selection.cropName}_report.doc`);

    // Excel (basic HTML table that Excel can open)
    const excelBlob = new Blob([html], { type: 'application/vnd.ms-excel' });
    this.triggerDownload(excelBlob, `${selection.farmName}_${selection.cropName}_report.xls`);

    // PDF via print - open new window and call print() so user can save as PDF
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      // give it a moment then print
      setTimeout(() => w.print(), 500);
    }
  }

  private buildReportHtml(farm: string, crop: string, activities: any[], observations: any[]) {
    const sanitize = (s: any) => (s === null || s === undefined) ? '' : String(s);
    const activityRows = (activities || []).map(a => `
      <tr>
        <td>${sanitize(a.createdAt)}</td>
        <td>${sanitize(a.activityType)}</td>
        <td>${sanitize(a.message)}</td>
      </tr>`).join('');

    const observationRows = (observations || []).map(o => `
      <tr>
        <td>${sanitize(o.createdAt)}</td>
        <td>${sanitize(o.observationType)}</td>
        <td>${sanitize(o.message)}</td>
      </tr>`).join('');

    return `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Farm Report</title>
        <style>body{font-family: Arial, Helvetica, sans-serif; padding:20px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} h1,h2{margin:8px 0;}</style>
      </head>
      <body>
        <h1>Farm: ${farm}</h1>
        <h2>Crop: ${crop}</h2>

        <h3>Activities</h3>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Message</th></tr></thead>
          <tbody>${activityRows}</tbody>
        </table>

        <h3>Observations</h3>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Message</th></tr></thead>
          <tbody>${observationRows}</tbody>
        </table>
      </body>
      </html>
    `;
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
