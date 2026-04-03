import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { EntitySearchService, EntityType, SearchResult, FarmOwnerSearchResult, FarmHelpSearchResult, FarmSearchResult } from './entity-search.service';
import { EntitySearchDialogComponent } from './entity-search-dialog/entity-search-dialog.component';

@Component({
  selector: 'app-entity-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './entity-search.component.html',
  styleUrl: './entity-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntitySearchComponent implements OnInit {
  @Input() entityType?: EntityType;
  @Output() selectedEntity = new EventEmitter<SearchResult>();
  @Output() clearSelectedEntity = new EventEmitter<void>();

  private entitySearchService = inject(EntitySearchService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  selectedEntityData: SearchResult | null = null;
  isShowingResults = false;

  ngOnInit() {
    // if (this.entityType) {
    //   this.openSearchDialog();
    // }
  }

  openSearchDialog(): void {
    const dialogRef = this.dialog.open(EntitySearchDialogComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: {
        preselectedEntityType: this.entityType,
        isEntityTypeDisabled: !!this.entityType
      }
    });

    dialogRef.afterClosed().subscribe((result: SearchResult | null) => {
      if (result) {
        this.selectedEntityData = result;
        this.isShowingResults = true;
        this.selectedEntity.emit(result);
      }
    });
  }

  openSearchAgain(): void {
    this.selectedEntityData = null;
    this.isShowingResults = false;
    this.clearSelectedEntity.emit();
    this.openSearchDialog();
  }
}
