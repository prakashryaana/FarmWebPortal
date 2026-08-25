// confirm-dialog.component.ts
import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface ConfirmData {
  title: string;
  message: string;
  action: string;
  isRed?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  template: `
    <div class="confirm-dialog-container" [class.danger-dialog]="data.isRed">
      <div class="dialog-header">
        <mat-icon class="header-icon">{{ data.isRed ? 'warning' : 'help_outline' }}</mat-icon>
        <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      </div>

      <mat-dialog-content class="dialog-content">
        <p class="main-message">{{ messageLines[0] }}</p>
        
        <div class="warning-banner" *ngIf="messageLines.length > 1">
          <mat-icon class="warning-banner-icon">error_outline</mat-icon>
          <span class="warning-text">{{ messageLines.slice(1).join('\n') }}</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button class="cancel-btn" (click)="onCancel()">Cancel</button>
        <button mat-raised-button [color]="data.isRed ? 'warn' : 'primary'" class="confirm-btn" (click)="onConfirm()">
          {{ data.action }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog-container {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 4px;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #64748b;
    }
    .danger-dialog .header-icon {
      color: #ef4444;
    }
    .dialog-title {
      margin: 0 !important;
      padding: 0 !important;
      font-size: 1.25rem !important;
      font-weight: 600 !important;
      color: #1e293b;
    }
    .dialog-content {
      margin-bottom: 20px !important;
      padding: 0 !important;
      color: #475569;
    }
    .main-message {
      font-size: 0.95rem;
      color: #334155;
      margin: 0 0 12px 0;
      line-height: 1.5;
    }
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 6px;
      padding: 10px 12px;
      color: #991b1b;
      margin-top: 12px;
    }
    .warning-banner-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ef4444;
      flex-shrink: 0;
    }
    .warning-text {
      font-size: 0.85rem;
      font-weight: 500;
      line-height: 1.4;
    }
    .dialog-actions {
      padding: 8px 0 0 0 !important;
      margin: 0 !important;
      gap: 8px;
    }
    .cancel-btn {
      color: #64748b !important;
      font-weight: 500 !important;
    }
    .confirm-btn {
      border-radius: 6px !important;
      font-weight: 500 !important;
    }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  
  get messageLines(): string[] {
    return this.data.message ? this.data.message.split('\n') : [];
  }

  onConfirm() { this.dialogRef.close(true); }
  onCancel() { this.dialogRef.close(false); }
}
