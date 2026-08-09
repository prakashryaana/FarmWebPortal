import { Component, inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FertilizerInventoryService } from '../../inventory/update-fertilizer-inventory/fertilizer-inventory.service';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-fertilizer-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './fertilizer-master.component.html',
  styleUrls: ['./fertilizer-master.component.css']
})
export class FertilizerMasterComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(FertilizerInventoryService);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(MatDialog);

  type: 'FERTILIZER' | 'DISEASE_CONTROL' = 'FERTILIZER';
  title = 'Fertilizer Master';
  list: string[] = [];
  editingName: string | null = null;

  get itemTypeName(): string {
    return this.type === 'DISEASE_CONTROL' ? 'Disease Control' : 'Fertilizer';
  }

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)])
  });

  ngOnInit() {
    // Read route data config to determine type
    const routeType = this.route.snapshot.data['type'];
    if (routeType === 'DISEASE_CONTROL') {
      this.type = 'DISEASE_CONTROL';
      this.title = 'Disease Control Master';
    } else {
      this.type = 'FERTILIZER';
      this.title = 'Fertilizer Master';
    }

    this.loadList();
  }

  loadList() {
    this.service.getInputCatalogNames(this.type).subscribe({
      next: (res) => {
        // Sort alphabetically for clean user presentation
        this.list = (res || []).sort((a, b) => a.localeCompare(b));
      },
      error: (err) => {
        console.error('Failed to load catalog list', err);
        this.snackBar.open('Failed to load list', 'Close', { duration: 3000 });
      }
    });
  }

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;
  private dialogRef?: any;

  openCreateForm() {
    this.form.reset();
    this.editingName = null;
    this.dialogRef = this.confirmDialog.open(this.dialogTemplate, {
      width: '400px',
      disableClose: true
    });
  }

  closeForm() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.editingName = null;
    this.form.reset();
  }

  selectForEdit(name: string) {
    this.form.patchValue({ name });
    this.editingName = name;
    this.dialogRef = this.confirmDialog.open(this.dialogTemplate, {
      width: '400px',
      disableClose: true
    });
  }

  submit() {
    if (!this.form.valid) {
      this.snackBar.open('Please enter a name', 'Close', { duration: 3000 });
      return;
    }

    const nameValue = this.form.get('name')?.value || '';
    const trimmedName = nameValue.trim();
    
    // Client-side duplicate check (case-insensitive)
    const isDuplicate = this.list.some(item => item.toLowerCase() === trimmedName.toLowerCase());

    if (this.editingName) {
      if (isDuplicate && trimmedName.toLowerCase() !== this.editingName.toLowerCase()) {
        this.snackBar.open(`${this.itemTypeName} already exists`, 'Close', {
          duration: 4000,
          panelClass: ['centered-warning-snackbar']
        });
        return;
      }

      this.service.updateInputCatalog({ type: this.type, oldName: this.editingName, newName: trimmedName }).subscribe({
        next: () => {
          this.snackBar.open('Updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['centered-success-snackbar']
          });
          this.loadList();
          this.closeForm();
        },
        error: (err) => {
          console.error('Failed to update catalog entry', err);
          const isExists = err.status === 400 && (err.error?.detail || err.error?.title || '').toLowerCase().includes('already exists');
          const message = isExists
            ? `${this.itemTypeName} already exists`
            : 'Update failed';
          this.snackBar.open(message, 'Close', {
            duration: 4000,
            panelClass: isExists ? ['centered-warning-snackbar'] : []
          });
        }
      });
    } else {
      if (isDuplicate) {
        this.snackBar.open(`${this.itemTypeName} already exists`, 'Close', {
          duration: 4000,
          panelClass: ['centered-warning-snackbar']
        });
        return;
      }

      this.service.createInputCatalog({ type: this.type, name: trimmedName }).subscribe({
        next: () => {
          this.snackBar.open('Created successfully', 'Close', {
            duration: 3000,
            panelClass: ['centered-success-snackbar']
          });
          this.loadList();
          this.closeForm();
        },
        error: (err) => {
          console.error('Failed to create catalog entry', err);
          const isExists = err.status === 400 && (err.error?.detail || err.error?.title || '').toLowerCase().includes('already exists');
          const message = isExists
            ? `${this.itemTypeName} already exists`
            : 'Creation failed';
          this.snackBar.open(message, 'Close', {
            duration: 4000,
            panelClass: isExists ? ['centered-warning-snackbar'] : []
          });
        }
      });
    }
  }

  delete(name: string) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${name}"?`,
        action: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.deleteInputCatalog(this.type, name).subscribe({
        next: () => {
          this.snackBar.open(`${this.itemTypeName} deleted successfully`, 'Close', {
            duration: 3000,
            panelClass: ['centered-error-snackbar']
          });
          this.loadList();
        },
        error: (err) => {
          console.error('Failed to delete catalog item', err);
          this.snackBar.open('Delete failed', 'Close', { duration: 4000 });
        }
      });
    });
  }

  goBack() {
    this.router.navigate(['/crop-master']);
  }
}
