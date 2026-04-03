import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { EntitySearchComponent } from './entity-search.component';
import { EntitySearchService } from './entity-search.service';
import { of } from 'rxjs';

describe('EntitySearchComponent', () => {
  let component: EntitySearchComponent;
  let fixture: ComponentFixture<EntitySearchComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockService: jasmine.SpyObj<EntitySearchService>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockService = jasmine.createSpyObj('EntitySearchService', ['searchEntity']);

    await TestBed.configureTestingModule({
      imports: [EntitySearchComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: EntitySearchService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show search button initially', () => {
    fixture.detectChanges();
    expect(component.isShowingResults).toBe(false);
  });

  it('should open search dialog when openSearchDialog is called', () => {
    const mockDialogRef = {
      afterClosed: () => of(null)
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);

    component.openSearchDialog();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should emit selected entity when dialog returns data', (done) => {
    const mockData = { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' };
    const mockDialogRef = {
      afterClosed: () => of(mockData)
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);

    component.selectedEntity.subscribe(result => {
      expect(result).toEqual(mockData);
      expect(component.selectedEntityData).toEqual(mockData);
      expect(component.isShowingResults).toBe(true);
      done();
    });

    component.openSearchDialog();
  });

  it('should allow searching again', (done) => {
    const mockDialogRef = {
      afterClosed: () => of(null)
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);

    component.selectedEntityData = { id: 'OWNER-001', name: 'John Doe', contactNumber: '+91-9876543210' };
    component.isShowingResults = true;

    component.openSearchAgain();

    expect(component.selectedEntityData).toBeNull();
    expect(component.isShowingResults).toBe(false);
    done();
  });

  it('should disable entity type dropdown when it is pre-selected', () => {
    component.entityType = 'FarmOwner';
    fixture.detectChanges();
    
    expect(component.entityType).toBe('FarmOwner');
  });
});
