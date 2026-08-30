import { Component, inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FertilizerInventoryService, InputCatalogItem } from '../../inventory/update-fertilizer-inventory/fertilizer-inventory.service';
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
  list: InputCatalogItem[] = [];
  editingName: string | null = null;
  unitTypes = ['packets', 'litres', 'mililitres', 'kg', 'grams'];
  displayUnits = ['kg', 'grams', 'litres', 'mililitres', 'packets', 'bottles'];

  get itemTypeName(): string {
    return this.type === 'DISEASE_CONTROL' ? 'Disease Control' : 'Fertilizer';
  }

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    unitType: new FormControl('Packets', [Validators.required]),
    quantityPerUnit: new FormControl<number | null>(null, [Validators.required, Validators.min(0.001)]),
    displayUnit: new FormControl('', [Validators.required])
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
        this.list = (res || []).sort((a, b) => a.name.localeCompare(b.name));
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
    this.form.reset({
      name: '',
      unitType: 'Packets',
      quantityPerUnit: null,
      displayUnit: ''
    });
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

  selectForEdit(item: InputCatalogItem) {
    this.form.patchValue({
      name: item.name,
      unitType: item.unitType || 'Packets',
      quantityPerUnit: item.quantityPerUnit || null,
      displayUnit: item.displayUnit || ''
    });
    this.editingName = item.name;
    this.dialogRef = this.confirmDialog.open(this.dialogTemplate, {
      width: '400px',
      disableClose: true
    });
  }

  submit() {
    if (!this.form.valid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    const nameValue = this.form.get('name')?.value || '';
    const trimmedName = nameValue.trim();
    const unitTypeValue = this.form.get('unitType')?.value || 'Packets';
    const quantityPerUnitValue = this.form.get('quantityPerUnit')?.value || 0;
    const displayUnitValue = this.form.get('displayUnit')?.value || '';

    // Client-side duplicate check (case-insensitive)
    const isDuplicate = this.list.some(item => item.name.toLowerCase() === trimmedName.toLowerCase());

    if (this.editingName) {
      if (isDuplicate && trimmedName.toLowerCase() !== this.editingName.toLowerCase()) {
        this.snackBar.open(`${this.itemTypeName} already exists`, 'Close', {
          duration: 4000,
          panelClass: ['centered-warning-snackbar']
        });
        return;
      }

      const payload = {
        type: this.type,
        oldName: this.editingName,
        newName: trimmedName,
        unitType: unitTypeValue,
        quantityPerUnit: quantityPerUnitValue,
        displayUnit: displayUnitValue
      };

      this.service.updateInputCatalog(payload).subscribe({
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

      const payload = {
        type: this.type,
        name: trimmedName,
        unitType: unitTypeValue,
        quantityPerUnit: quantityPerUnitValue,
        displayUnit: displayUnitValue
      };

      this.service.createInputCatalog(payload).subscribe({
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

  delete(item: InputCatalogItem) {
    const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${item.name}"?`,
        action: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.deleteInputCatalog(this.type, item.name).subscribe({
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

  downloadQRCode(item: InputCatalogItem) {
    const typeValue = this.type === 'DISEASE_CONTROL' ? 'Disease Control' : 'Fertilizer';
    const jsonText = JSON.stringify({ productName: item.name, type: typeValue });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(jsonText)}`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = 400;
        canvas.height = 470;

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR Code
        ctx.drawImage(img, 0, 0, 400, 400);

        // Draw centered product name text (further increased font size)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, 200, 435, 380);

        // Trigger download
        const link = document.createElement('a');
        link.download = `${item.name.replace(/\s+/g, '_')}_QR.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      img.src = qrUrl;
    }
  }

  goBack() {
    this.router.navigate(['/crop-master']);
  }
}
