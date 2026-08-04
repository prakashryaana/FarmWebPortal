import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FertilizerInventoryService } from '../../inventory/update-fertilizer-inventory/fertilizer-inventory.service';
import { ConfirmDialogComponent } from '../../users/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-fertilizer-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
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
  isFormExpanded = false;

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

  openCreateForm() {
    this.form.reset();
    this.isFormExpanded = true;
  }

  closeForm() {
    this.isFormExpanded = false;
    this.form.reset();
  }

  submit() {
    if (!this.form.valid) {
      this.snackBar.open('Please enter a name', 'Close', { duration: 3000 });
      return;
    }

    const nameValue = this.form.get('name')?.value || '';
    
    this.service.createInputCatalog({ type: this.type, name: nameValue }).subscribe({
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
        this.snackBar.open('Creation failed', 'Close', { duration: 4000 });
      }
    });
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
          this.snackBar.open('Deleted successfully', 'Close', { duration: 3000 });
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
