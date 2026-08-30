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
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-actions',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, ListActivityComponent, ListObservationComponent, TranslateModule, FormsModule],
  templateUrl: './view-actions.component.html',
  styleUrls: ['./view-actions.component.css']
})
export class ViewActionsComponent {
  private readonly cropFarmSelector = inject(CropFarmSelectorService);
  private readonly activityService = inject(ActivityService);
  private readonly observationService = inject(ObservationService);

  get selectedCropName() { return this.cropFarmSelector.selectedCropName(); }
  get selectedFarmName() { return this.cropFarmSelector.selectedFarmName(); }

  showNewReportView = false;
  useDateFilter = false;
  reportStartDate: string | null = null;
  reportEndDate: string | null = null;
  reportDisplayStartDate: Date | null = null;
  reportDisplayEndDate: Date | null = null;
  generatedReportLoading = false;
  generatedReportRun = false;
  generatedActivities: any[] = [];
  generatedObservations: any[] = [];

  toggleNewReportView() {
    this.showNewReportView = !this.showNewReportView;
    if (this.showNewReportView) {
      this.generatedReportRun = false;
      this.generatedActivities = [];
      this.generatedObservations = [];
    }
  }

  async generateNewReport(): Promise<void> {
    const selection = this.cropFarmSelector.selectedCropFarm();
    if (!selection) {
      alert('Please select a farm and crop first.');
      return;
    }

    const cropId = selection.cropId;
    this.generatedReportLoading = true;
    this.generatedReportRun = false;

    try {
      const activities = await firstValueFrom(this.activityService.getByCrop(cropId));
      const observations = await firstValueFrom(this.observationService.getByCrop(cropId));

      let filteredActivities = activities || [];
      let filteredObservations = observations || [];

      if (this.useDateFilter) {
        if (this.reportStartDate) {
          const start = new Date(this.reportStartDate).getTime();
          filteredActivities = filteredActivities.filter(a => new Date(a.createdAt).getTime() >= start);
          filteredObservations = filteredObservations.filter(o => new Date(o.createdAt).getTime() >= start);
          this.reportDisplayStartDate = new Date(this.reportStartDate);
        } else {
          this.reportDisplayStartDate = null;
        }

        if (this.reportEndDate) {
          const end = new Date(this.reportEndDate);
          end.setHours(23, 59, 59, 999);
          const endTime = end.getTime();
          filteredActivities = filteredActivities.filter(a => new Date(a.createdAt).getTime() <= endTime);
          filteredObservations = filteredObservations.filter(o => new Date(o.createdAt).getTime() <= endTime);
          this.reportDisplayEndDate = new Date(this.reportEndDate);
        } else {
          this.reportDisplayEndDate = null;
        }
      } else {
        this.reportDisplayStartDate = null;
        this.reportDisplayEndDate = null;
      }

      this.generatedActivities = filteredActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.generatedObservations = filteredObservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.generatedReportRun = true;
    } catch (e) {
      console.error('Error generating report:', e);
      alert('Failed to generate report.');
    } finally {
      this.generatedReportLoading = false;
    }
  }

  exportNewReportPdf() {
    const selection = this.cropFarmSelector.selectedCropFarm();
    if (!selection) return;
    const html = this.buildReportHtml(selection.farmName, selection.cropName, this.generatedActivities, this.generatedObservations);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  }

  exportNewReportExcel() {
    const selection = this.cropFarmSelector.selectedCropFarm();
    if (!selection) return;
    const html = this.buildReportHtml(selection.farmName, selection.cropName, this.generatedActivities, this.generatedObservations);
    const excelBlob = new Blob([html], { type: 'application/vnd.ms-excel' });
    this.triggerDownload(excelBlob, `${selection.farmName}_${selection.cropName}_report.xls`);
  }

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

  formatDate(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  }

  private buildReportHtml(farm: string, crop: string, activities: any[], observations: any[]) {
    const sanitize = (s: any) => (s === null || s === undefined) ? '' : String(s);
    const activityRows = (activities || []).map(a => `
      <tr>
        <td>${this.formatDate(a.createdAt)}</td>
        <td>${sanitize(a.activityType)}</td>
        <td>${sanitize(a.message)}</td>
      </tr>`).join('');

    const observationRows = (observations || []).map(o => `
      <tr>
        <td>${this.formatDate(o.createdAt)}</td>
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
