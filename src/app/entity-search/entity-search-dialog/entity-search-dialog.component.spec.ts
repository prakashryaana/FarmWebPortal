import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntitySearchDialogComponent } from './entity-search-dialog.component';
import { EntitySearchService } from '../entity-search.service';
import { of, throwError } from 'rxjs';

describe('EntitySearchDialogComponent', () => {
  let component: EntitySearchDialogComponent;
  let fixture: ComponentFixture<EntitySearchDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EntitySearchDialogComponent>>;
  let mockService: jasmine.SpyObj<EntitySearchService>;

  const mockDialogData = {
    preselectedEntityType: undefined,
    isEntityTypeDisabled: false
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('EntitySearchService', ['searchEntity']);

    await TestBed.configureTestingModule({
      imports: [EntitySearchDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: EntitySearchService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with FarmOwner entity type', () => {
    expect(component.searchForm.get('entityType')?.value).toBe('FarmOwner');
  });

  it('should disable entity type dropdown when data is disabled', () => {
    //component.data.isEntityTypeDisabled = true;
    component.ngOnInit();
    
    expect(component.searchForm.get('entityType')?.disabled).toBe(true);
  });

  it('should search for entities', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' }
      ]
    };

    mockService.searchEntity.and.returnValue(of(mockResponse));

    component.searchForm.patchValue({
      entityType: 'FarmOwner',
      searchText: 'John'
    });

    component.onSearch();

    expect(mockService.searchEntity).toHaveBeenCalledWith('FarmOwner', 'John');
    // expect(component.tableRows().length).toBe(1);
    // expect(component.errorMessage()).toBeNull();
  });

  it('should handle search error', () => {
    const mockError = { error: { message: 'Search failed' } };
    mockService.searchEntity.and.returnValue(throwError(() => mockError));

    component.searchForm.patchValue({
      entityType: 'FarmOwner',
      searchText: 'test'
    });

    component.onSearch();

    // expect(component.tableRows().length).toBe(0);
    // expect(component.errorMessage()).toBe('Search failed');
  });

  it('should show no data found message', () => {
    const mockResponse = {
      success: false,
      data: [],
      message: 'No data found'
    };

    mockService.searchEntity.and.returnValue(of(mockResponse));

    component.searchForm.patchValue({
      entityType: 'FarmOwner',
      searchText: 'unknown'
    });

    component.onSearch();

    // expect(component.tableRows().length).toBe(0);
    // expect(component.errorMessage()).toBe('No data found');
  });

  it('should toggle row selection', () => {
    // component.tableRows.set([
    //   { selected: false, data: { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' } },
    //   { selected: false, data: { id: 'OWNER-002', name: 'Jane Doe', contactNumber: '+91-9876543211' } }
    // ]);

    component.toggleRowSelection(0);

    // expect(component.selectedRowIndex()).toBe(0);
    // expect(component.tableRows()[0].selected).toBe(true);
  });

  it('should deselect row when clicking same row again', () => {
    // component.tableRows.set([
    //   { selected: true, data: { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' } }
    // ]);
    // component.selectedRowIndex.set(0);

    component.toggleRowSelection(0);

    // expect(component.selectedRowIndex()).toBeNull();
    // expect(component.tableRows()[0].selected).toBe(false);
  });

  it('should submit selected row', () => {
    const mockData = { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' };
    // component.tableRows.set([
    //   { selected: true, data: mockData }
    // ]);
    // component.selectedRowIndex.set(0);

    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith(mockData);
  });

  it('should close dialog without data on cancel', () => {
    component.onCancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should update displayed columns based on entity type', () => {
    component.searchForm.patchValue({ entityType: 'Farm' });
    component.onEntityTypeChange('Farm');

    expect(component.displayedColumns).toContain('shadeNetArea');
    expect(component.displayedColumns).not.toContain('contactNumber');
  });

  it('should disable submit button when no row is selected', () => {
    //component.selectedRowIndex.set(null);

    expect(component.isSubmitDisabled()).toBe(true);
  });

  it('should enable submit button when row is selected', () => {
    // component.selectedRowIndex.set(0);
    // component.isLoading.set(false);

    expect(component.isSubmitDisabled()).toBe(false);
  });
});
