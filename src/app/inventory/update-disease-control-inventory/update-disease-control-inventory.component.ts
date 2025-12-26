import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DiseaseControlInventoryService, DiseaseControlInventory } from './disease-control-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-update-disease-control-inventory',
  templateUrl: './update-disease-control-inventory.component.html',
  styleUrls: ['./update-disease-control-inventory.component.css'],
  imports:[ReactiveFormsModule]
})
export class UpdateDiseaseControlInventoryComponent {
  private snackBar = inject(MatSnackBar);
  private svc = inject(DiseaseControlInventoryService);

  diseaseControlInventoryForm = new FormGroup({
    id: new FormControl(''),
    diseaseControlName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    quantitySupplied: new FormControl(0.0, [Validators.required]),
    suppliedDate: new FormControl(null),
    quantityUsed: new FormControl(0.0, [Validators.required]),
    usedDate: new FormControl(null)
  });

  list: DiseaseControlInventory[] = [];

  constructor(){ this.load(); }

  load(){ this.svc.list().subscribe({ next: r => this.list = r, error: e => console.error(e) }); }

  select(item: DiseaseControlInventory){
    this.diseaseControlInventoryForm.patchValue({
      id: item.id,
      diseaseControlName: item.diseaseControlName,
      quantitySupplied: item.quantitySupplied,
      suppliedDate: item.suppliedDate ? new Date(item.suppliedDate) : null,
      quantityUsed: item.quantityUsed,
      usedDate: item.usedDate ? new Date(item.usedDate) : null
    });
  }

  create(){ if (!this.diseaseControlInventoryForm.valid) return; const payload = this.buildPayload(); this.svc.create(payload).subscribe({ next: () => { this.snackBar.open('Created','Close',{duration:3000}); this.load(); this.diseaseControlInventoryForm.reset(); }, error: e => { console.error(e); this.snackBar.open('Create failed','Close',{duration:4000}); } }); }
  update(){ const id = this.diseaseControlInventoryForm.get('id')?.value; if (!id) { this.snackBar.open('Select an item to update','Close',{duration:3000}); return; } if (!this.diseaseControlInventoryForm.valid) return; const payload = this.buildPayload(); this.svc.update(id, payload).subscribe({ next: () => { this.snackBar.open('Updated','Close',{duration:3000}); this.load(); this.diseaseControlInventoryForm.reset(); }, error: e => { console.error(e); this.snackBar.open('Update failed','Close',{duration:4000}); } }); }
  delete(){ const id = this.diseaseControlInventoryForm.get('id')?.value; if (!id) { this.snackBar.open('Select an item to delete','Close',{duration:3000}); return; } this.svc.delete(id).subscribe({ next: () => { this.snackBar.open('Deleted','Close',{duration:3000}); this.load(); this.diseaseControlInventoryForm.reset(); }, error: e => { console.error(e); this.snackBar.open('Delete failed','Close',{duration:4000}); } }); }

  private buildPayload(){
    return {
      diseaseControlName: this.diseaseControlInventoryForm.get('diseaseControlName')?.value,
      quantitySupplied: parseFloat(Number(this.diseaseControlInventoryForm.get('quantitySupplied')?.value || 0).toFixed(2)),
      suppliedDate: this.diseaseControlInventoryForm.get('suppliedDate')?.value,
      quantityUsed: parseFloat(Number(this.diseaseControlInventoryForm.get('quantityUsed')?.value || 0).toFixed(2)),
      usedDate: this.diseaseControlInventoryForm.get('usedDate')?.value
    };
  }
}
