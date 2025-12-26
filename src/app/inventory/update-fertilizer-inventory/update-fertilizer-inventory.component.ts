import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FertilizerInventoryService, FertilizerInventory } from './fertilizer-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-update-fertilizer-inventory',
  templateUrl: './update-fertilizer-inventory.component.html',
  styleUrls: ['./update-fertilizer-inventory.component.css'],
  imports: [ReactiveFormsModule]
})
export class UpdateFertilizerInventoryComponent {
  private snackBar = inject(MatSnackBar);
  private svc = inject(FertilizerInventoryService);

  fertilizerInventoryform = new FormGroup({
    id: new FormControl(''),
    fertilizerName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    quantitySupplied: new FormControl(0.0, [Validators.required]),
    suppliedDate: new FormControl(null),
    quantityUsed: new FormControl(0.0, [Validators.required]),
    usedDate: new FormControl(null)
  });

  list: FertilizerInventory[] = [];

  constructor(){ this.load(); }

  load(){ this.svc.list().subscribe({ next: r => this.list = r, error: e => console.error(e) }); }

  select(item: FertilizerInventory){
    this.fertilizerInventoryform.patchValue({
      id: item.id,
      fertilizerName: item.fertilizerName,
      quantitySupplied: item.quantitySupplied,
      suppliedDate: item.suppliedDate ? new Date(item.suppliedDate) : null,
      quantityUsed: item.quantityUsed,
      usedDate: item.usedDate ? new Date(item.usedDate) : null
    });
  }

  create(){
    if (!this.fertilizerInventoryform.valid) return;
    const payload = this.buildPayload();
    this.svc.create(payload).subscribe({ next: () => { this.snackBar.open('Created', 'Close',{duration:3000}); this.load(); this.fertilizerInventoryform.reset(); }, error: e => { console.error(e); this.snackBar.open('Create failed','Close',{duration:4000}); } });
  }

  update(){
    const id = this.fertilizerInventoryform.get('id')?.value;
    if (!id) { this.snackBar.open('Select an item to update','Close',{duration:3000}); return; }
    if (!this.fertilizerInventoryform.valid) return;
    const payload = this.buildPayload();
    this.svc.update(id, payload).subscribe({ next: () => { this.snackBar.open('Updated','Close',{duration:3000}); this.load(); this.fertilizerInventoryform.reset(); }, error: e => { console.error(e); this.snackBar.open('Update failed','Close',{duration:4000}); } });
  }

  delete(){
    const id = this.fertilizerInventoryform.get('id')?.value;
    if (!id) { this.snackBar.open('Select an item to delete','Close',{duration:3000}); return; }
    this.svc.delete(id).subscribe({ next: () => { this.snackBar.open('Deleted','Close',{duration:3000}); this.load(); this.fertilizerInventoryform.reset(); }, error: e => { console.error(e); this.snackBar.open('Delete failed','Close',{duration:4000}); } });
  }

  private buildPayload(){
    return {
      fertilizerName: this.fertilizerInventoryform.get('fertilizerName')?.value,
      quantitySupplied: parseFloat(Number(this.fertilizerInventoryform.get('quantitySupplied')?.value || 0).toFixed(2)),
      suppliedDate: this.fertilizerInventoryform.get('suppliedDate')?.value,
      quantityUsed: parseFloat(Number(this.fertilizerInventoryform.get('quantityUsed')?.value || 0).toFixed(2)),
      usedDate: this.fertilizerInventoryform.get('usedDate')?.value
    };
  }
}
