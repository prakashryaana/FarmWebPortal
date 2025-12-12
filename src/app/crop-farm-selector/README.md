# Crop Farm Selector Component

A global-level, top-level component system that provides crop and farm selection functionality accessible throughout the FarmWebPortal application.

## Overview

The Crop Farm Selector is a hierarchical selection system that allows users to search for and select crop-farm combinations. The selected crop and farm data persists throughout the application session and is displayed in a toolbar at the top-right of the header.

### Architecture

```
App Component (Root)
├── Header
│   ├── Brand Name (EasyGrow)
│   └── Crop Farm Selector Toolbar (Top Right)
└── Main Content (Router Outlet)
    └── Child Components (all have access to selected Crop/Farm via service)
```

## Components

### 1. CropFarmSelectorService

**File**: `crop-farm-selector.service.ts`

**Purpose**: Central state management and data access layer for crop-farm selection.

**Public Signals** (Read-only computed):
- `selectedFarmId` - Currently selected farm ID
- `selectedCropId` - Currently selected crop ID
- `selectedFarmName` - Currently selected farm name
- `selectedCropName` - Currently selected crop name
- `selectedCropFarm` - Complete selected crop-farm object

**Public Observables**:
- `searchResults$` - Observable of search results array

**Key Methods**:

```typescript
// Search for crop-farm combinations based on query
searchCropFarm(searchQuery: string): Promise<CropOption[]>

// Select a crop-farm combination and persist it
selectCropFarm(option: CropOption): void

// Clear the current selection
clearSelection(): void

// Get search results as observable
getSearchResults(): Observable<CropOption[]>
```

**Data Models**:

```typescript
interface CropOption {
  farmId: string;
  farmName: string;
  cropId: string;
  cropName: string;
}

interface SelectedCropFarm {
  farmId: string;
  farmName: string;
  cropId: string;
  cropName: string;
}
```

**State Persistence**:
- Uses Angular signals for reactive state management
- Automatically persists selection to `sessionStorage` under key `'selectedCropFarm'`
- Restores selection on service initialization from `sessionStorage`

---

### 2. CropFarmSelectorDialogComponent

**File**: `crop-farm-selector-dialog.component.ts`

**Purpose**: Modal dialog for searching and selecting crops/farms.

**Features**:
- Single input field for flexible search (supports cropId, cropName, farmId, farmName)
- Debounced search (300ms) to reduce API calls
- Material table displaying search results with columns:
  - Farm Name
  - Farm ID
  - Crop Name
  - Crop ID
  - Action (Select button)
- Loading spinner during search
- Empty state and no results messages
- ESC key support to close dialog

**Dialog Dimensions**:
- Width: 800px
- Max Height: 90vh

**Close Behavior**:
- Selection closes the dialog automatically
- Cancel button available
- ESC key closes the dialog

---

### 3. CropFarmSelectorToolbarComponent

**File**: `crop-farm-selector-toolbar.component.ts`

**Purpose**: Displays selected crop-farm in the header toolbar and provides access to selection dialog.

**Display States**:

**State 1: No Selection**
```
[+] No crop selected
```

**State 2: With Selection**
```
Farm: TestFarm | Crop: Wheat  [Edit] [X]
```

**Features**:
- Displays farm and crop names with tooltips showing their IDs
- Clickable farm/crop names to re-open selection dialog
- Edit button (pencil icon) to change selection
- Clear button (X icon) to remove selection
- Reactive updates when service signals change
- Responsive design for mobile/tablet screens

**Tooltips**:
- Farm name → shows "Farm ID: [farmId]"
- Crop name → shows "Crop ID: [cropId]"

---

## Integration with App

### In `app.component.ts`:

```typescript
import { CropFarmSelectorToolbarComponent } from './crop-farm-selector/crop-farm-selector-toolbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FarmOwnerRegistrationComponent, CropFarmSelectorToolbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  protected readonly title = signal('FarmWebPortal');
}
```

### In `app.component.html`:

```html
<header class="brand-name">
  <h1>EasyGrow</h1>
  <app-crop-farm-selector-toolbar class="toolbar-right"></app-crop-farm-selector-toolbar>
</header>
```

### In `app.component.css`:

Header is configured as a flex container with the toolbar positioned on the right:
- `justify-content: space-between` aligns brand name left, toolbar right
- Toolbar has `flex-shrink: 0` to maintain size
- Header has bottom border and shadow for visual separation

---

## Usage in Child Components

### Inject and Access Service

```typescript
import { Component, OnInit } from '@angular/core';
import { CropFarmSelectorService } from '../crop-farm-selector/crop-farm-selector.service';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.css']
})
export class MyComponent implements OnInit {
  constructor(private selectorService: CropFarmSelectorService) {}

  ngOnInit(): void {
    // Get current selection
    const farmId = this.selectorService.selectedFarmId();
    const cropId = this.selectorService.selectedCropId();
    const farmName = this.selectorService.selectedFarmName();
    const cropName = this.selectorService.selectedCropName();

    // Get complete selection object
    const selection = this.selectorService.selectedCropFarm();

    // Watch for changes using effect (Angular 21+)
    effect(() => {
      const updated = this.selectorService.selectedCropFarm();
      if (updated) {
        console.log('Selection changed:', updated);
      }
    });
  }
}
```

### Template Usage

```html
<div *ngIf="(selectorService.selectedFarmId as farmId)">
  <p>Selected Farm: {{ selectorService.selectedFarmName() }}</p>
  <p>Selected Crop: {{ selectorService.selectedCropName() }}</p>
</div>
```

---

## Search Logic

The search functionality (`searchCropFarm`) works as follows:

1. **Farm Search**: Queries the backend API for farms matching the search query
   - Endpoint: `GET /api/Farm/search?query=<searchQuery>`
   - Returns farms with their associated crops

2. **Crop Search**: Additionally searches for crops matching the query
   - Endpoint: `GET /api/Crop/search?query=<searchQuery>`
   - Links crops back to their farms

3. **Result Combination**: Merges results from both searches and deduplicates

4. **Return Format**: Returns array of `CropOption` objects containing farm and crop data

**Search Query Syntax**: The search query supports:
- `farmId` - Exact farm ID match
- `farmName` - Partial farm name match
- `cropId` - Exact crop ID match
- `cropName` - Partial crop name match

---

## Styling

### Toolbar Component
- Gradient background (#f5f5f5 to #ffffff)
- Rounded corners with subtle shadow
- Responsive layout:
  - **Desktop**: Horizontal layout with separator
  - **Tablet/Mobile** (< 768px): Stacked vertical layout

### Dialog Component
- Material Design styling
- Maximum height with scrollable content
- Clean table layout with hover states
- Loading spinner during search

### Color Scheme
- Farm items: Blue (#1976d2)
- Crop items: Green (#388e3c)
- Icons: Material Design icons with custom colors
- Hover states: Transparent background overlays

---

## Testing

### Service Tests (`crop-farm-selector.service.spec.ts`)
- Service creation
- Initial state (no selection)
- Select and persist functionality
- Clear selection
- Session storage persistence
- Signal computations
- Observable subscriptions

### Dialog Component Tests (`crop-farm-selector-dialog.component.spec.ts`)
- Component creation
- Form initialization
- Search result handling
- Crop selection
- Dialog closing
- Table column configuration

### Toolbar Component Tests (`crop-farm-selector-toolbar.component.spec.ts`)
- Component creation
- Initial display states
- Selection display
- Dialog opening
- Clear selection functionality
- Signal reactivity

---

## API Integration

The component expects the following API endpoints:

### Farm Search
```
GET /api/Farm/search?query=<searchQuery>
```

**Response Format**:
```json
[
  {
    "farmId": "FARM001",
    "farmName": "Smith Farm",
    "Crops": [
      {
        "cropId": "CROP001",
        "cropName": "Wheat"
      }
    ]
  }
]
```

### Crop Search
```
GET /api/Crop/search?query=<searchQuery>
```

**Response Format**:
```json
[
  {
    "cropId": "CROP001",
    "cropName": "Wheat",
    "FarmId": "FARM001",
    "FarmName": "Smith Farm"
  }
]
```

---

## Future Enhancements

1. **Advanced Filters**: Add filtering by crop type, farm location, etc.
2. **Favorites**: Allow saving favorite crop-farm combinations
3. **Recent Selections**: Display recently selected combinations
4. **Search History**: Persist search history
5. **Bulk Operations**: Select multiple crops/farms for batch operations
6. **Local Storage**: Optional persistence across browser sessions
7. **Crop Calendar**: Integration with crop lifecycle calendar
8. **Analytics**: Track most frequently selected crops/farms

---

## Troubleshooting

### Selection not persisting across page refresh
- Check if `sessionStorage` is available in browser
- Verify service is properly injected as singleton (provided in 'root')

### Dialog not opening
- Ensure `MatDialog` is available (should be auto-provided by Material)
- Check browser console for errors

### Search returning no results
- Verify backend API endpoints are correct
- Check API response format matches expected structure
- Ensure search query parameters are properly formatted

### Toolbar not displaying
- Verify toolbar component is imported in `app.component.ts`
- Check CSS flexbox layout in `app.component.css`
- Inspect element to verify toolbar HTML is rendered

---

## Dependencies

- Angular 21+ (for signals and standalone components)
- Angular Material 21+
- RxJS (for observables and operators)

---

## File Structure

```
src/app/crop-farm-selector/
├── crop-farm-selector.service.ts
├── crop-farm-selector.service.spec.ts
├── crop-farm-selector-dialog.component.ts
├── crop-farm-selector-dialog.component.html
├── crop-farm-selector-dialog.component.css
├── crop-farm-selector-dialog.component.spec.ts
├── crop-farm-selector-toolbar.component.ts
├── crop-farm-selector-toolbar.component.html
├── crop-farm-selector-toolbar.component.css
├── crop-farm-selector-toolbar.component.spec.ts
└── README.md (this file)
```
