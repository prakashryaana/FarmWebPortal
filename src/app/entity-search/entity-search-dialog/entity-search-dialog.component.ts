import {
    Component,
    OnInit,
    Inject,
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
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EntitySearchService, EntityType, SearchResult, FarmOwnerSearchResult, FarmHelpSearchResult, FarmSearchResult } from '../entity-search.service';

interface DialogData {
    preselectedEntityType?: EntityType;
    isEntityTypeDisabled: boolean;
}

interface TableRow {
    selected: boolean;
    data: SearchResult;
    index: number;
}

@Component({
    selector: 'app-entity-search-dialog',
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
        MatDialogModule,
        ScrollingModule
    ],
    templateUrl: './entity-search-dialog.component.html',
    styleUrl: './entity-search-dialog.component.css'
    // ,
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntitySearchDialogComponent implements OnInit {
    isLoading = false;
    errorMessage: string | null = null;
    tableRows: TableRow[] = [];
    selectedRowIndex: number | null = null;
    displayedColumns: string[] = ['select', 'id', 'name'];

    entityTypeOptions: { label: string; value: EntityType }[] = [
        { label: 'Farm Owner', value: 'FarmOwner' },
        { label: 'Farm Help', value: 'FarmHelp' },
        { label: 'Farm', value: 'Farm' }
    ];

    searchForm = new FormGroup({
        entityType: new FormControl<EntityType>('FarmOwner', [Validators.required]),
        searchText: new FormControl('', [Validators.required, Validators.minLength(2)])
    });

    constructor(
        private entitySearchService: EntitySearchService,
        private dialogRef: MatDialogRef<EntitySearchDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: DialogData
    ) { }

    ngOnInit() {
        if (this.data.preselectedEntityType) {
            this.searchForm.patchValue({
                entityType: this.data.preselectedEntityType
            });
        }

        if (this.data.isEntityTypeDisabled) {
            this.searchForm.get('entityType')?.disable();
        }

        this.updateDisplayedColumns();
    }

    onEntityTypeChange(entityType: EntityType): void {
        this.updateDisplayedColumns();
        this.tableRows = [];
        this.errorMessage = null;
    }

    private updateDisplayedColumns(): void {
        const entityType = this.searchForm.get('entityType')?.value;

        if (entityType === 'Farm') {
            this.displayedColumns = ['select', 'id', 'name'];
        } else {
            this.displayedColumns = ['select', 'id', 'name'];
        }
    }

    onSearch(): void {
        if (this.searchForm.invalid) {
            return;
        }

        const entityType = this.searchForm.get('entityType')?.value as EntityType;
        const searchText = this.searchForm.get('searchText')?.value || '';

        if (!searchText.trim()) {
            this.errorMessage = 'Please enter a search term';
            return;
        }

        this.isLoading = true;
        this.errorMessage = null;
        this.tableRows = [];

        this.entitySearchService.searchEntity(entityType, searchText).subscribe({
            next: (response) => {
                this.isLoading = false;

                if (response.success && response.data && response.data.length > 0) {
                    const rows: TableRow[] = response.data.map((item, index) => ({
                        selected: false,
                        data: item,
                        index: index
                    }));
                    this.tableRows = rows;
                    this.errorMessage = null;
                } else {
                    this.tableRows = [];
                    this.errorMessage = response.message || 'No data found';
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.tableRows = [];
                this.errorMessage = error.error?.message || 'An error occurred during search';
                console.error('Search error:', error);
            }
        });
    }

    toggleRowSelection(index: number): void {
        const rows = this.tableRows;
        if (this.selectedRowIndex === index) {
            this.selectedRowIndex = null;
            rows[index].selected = false;
        } else {
            // Clear previous selection
            rows.forEach((row, i) => {
                row.selected = i === index;
            });
            this.selectedRowIndex = index;
        }
        this.tableRows = [...rows];
    }

    onSubmit(): void {
        if (this.selectedRowIndex === null) {
            return;
        }

        const selectedRow = this.tableRows[this.selectedRowIndex];
        this.dialogRef.close(selectedRow.data);
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }

    getRowClass(index: number): string {
        return this.selectedRowIndex === index ? 'selected-row' : '';
    }

    isSubmitDisabled(): boolean {
        return this.selectedRowIndex === null || this.isLoading;
    }
}
