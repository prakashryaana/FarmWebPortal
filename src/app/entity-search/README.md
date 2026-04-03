# Entity Search Component

A comprehensive standalone Angular component for searching and selecting entities (FarmOwner, FarmHelp, or Farm) with a clean UI and modal dialog interface.

## Features

- **Entity Type Selection**: Choose from FarmOwner, FarmHelp, or Farm entity types
- **Search Functionality**: Search by entity ID or name
- **Results Table**: Display search results with columns specific to entity type
- **Row Selection**: Select a single entity from results
- **Modal Dialog**: Clean modal interface for search operations
- **Error Handling**: Display error messages when search fails or no data found
- **Parent Integration**: Returns selected entity data back to parent component
- **Repeat Search**: Ability to perform multiple searches without closing the parent component
- **Optional Pre-selection**: Accept entity type as input with option to disable dropdown

## Installation

The component is already installed in the application at:
```
src/app/entity-search/
```

## Usage

### 1. Import the Component

Import `EntitySearchComponent` in your parent component:

```typescript
import { EntitySearchComponent } from './entity-search/entity-search.component';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [EntitySearchComponent, ...otherImports],
  templateUrl: './my-component.html'
})
export class MyComponent {
  // ...
}
```

### 2. Use in Template

#### Basic Usage (Default - Shows Search Button):

```html
<app-entity-search (selectedEntity)="onEntitySelected($event)"></app-entity-search>
```

#### With Pre-selected Entity Type (Dropdown Disabled):

```html
<app-entity-search 
  [entityType]="'FarmOwner'" 
  (selectedEntity)="onEntitySelected($event)">
</app-entity-search>
```

### 3. Handle Selection

```typescript
export class MyComponent {
  onEntitySelected(entity: FarmOwnerSearchResult | FarmHelpSearchResult | FarmSearchResult) {
    console.log('Selected entity:', entity);
    
    // Use the entity data here
    if ('contactNumber' in entity) {
      console.log('Contact:', entity.contactNumber);
    } else if ('shadeNetArea' in entity) {
      console.log('Shade Net Area:', entity.shadeNetArea);
    }
  }
}
```

## Component API

### Inputs

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `entityType` | `'FarmOwner' \| 'FarmHelp' \| 'Farm'` | No | Pre-select entity type and disable dropdown |

### Outputs

| Event | Payload | Description |
|-------|---------|-------------|
| `selectedEntity` | `SearchResult` | Emitted when user submits selected entity |

### Search Result Types

#### FarmOwnerSearchResult
```typescript
{
  id: string;
  name: string;
  contactNumber: string;
}
```

#### FarmHelpSearchResult
```typescript
{
  id: string;
  name: string;
  contactNumber: string;
}
```

#### FarmSearchResult
```typescript
{
  id: string;
  name: string;
  shadeNetArea: string;
}
```

## Backend API Requirements

The component expects the following API endpoints:

### Search Endpoints

**FarmOwner Search:**
```
GET /api/Owner/search?searchTerm={searchTerm}
```

**FarmHelp (Maintainer) Search:**
```
GET /api/Maintainer/search?searchTerm={searchTerm}
```

**Farm Search:**
```
GET /api/Farm/search?searchTerm={searchTerm}
```

### Response Format

All endpoints should return:

```typescript
{
  success: boolean;
  data: SearchResult[];
  message?: string;
}
```

#### Example Response for FarmOwner:
```json
{
  "success": true,
  "data": [
    {
      "id": "OWNER-001",
      "name": "John Doe",
      "contactNumber": "+91-9876543210"
    },
    {
      "id": "OWNER-002",
      "name": "Jane Smith",
      "contactNumber": "+91-9876543211"
    }
  ],
  "message": "Search successful"
}
```

#### Example Response for Farm:
```json
{
  "success": true,
  "data": [
    {
      "id": "FARM-001",
      "name": "Green Valley Farm",
      "shadeNetArea": "1000 sqm"
    }
  ],
  "message": "Search successful"
}
```

#### Error Response:
```json
{
  "success": false,
  "data": [],
  "message": "No data found"
}
```

## User Workflow

1. **Initial Display**: Component shows a search icon with "Search" text
2. **Click Search**: User clicks the search button
3. **Modal Opens**: Search dialog appears with:
   - Entity type dropdown (or locked if pre-selected)
   - Search text input
   - Search button
4. **Enter Search Term**: User enters ID or name to search for
5. **Click Search**: Search is performed
6. **View Results**: If successful, table displays matching entities
   - If no results, error message is shown
7. **Select Entity**: User clicks a row to select it (radio button)
8. **Click Submit**: Selected entity data is returned to parent
9. **Display Selected**: Parent component displays selected entity info
10. **Search Again**: User can click the search icon again to search for another entity

## Component Lifecycle

- **Initial State**: Search button visible
- **Modal Open**: User can search
- **Results Received**: Table populates or error shown
- **Selection Made**: Row highlighted with radio button
- **Submit Clicked**: Data returned via `selectedEntity` event
- **Dialog Closes**: Component displays selected entity
- **Search Again**: Resets state and reopens dialog

## Styling

The component uses Angular Material Design and includes:
- Responsive layout
- Mobile-friendly design
- Custom scrollbar styling
- Hover effects on table rows
- Disabled button states
- Loading spinner

## Scoped CSS Classes

- `.entity-search-dialog` - Main dialog container
- `.search-form-container` - Search input area
- `.results-container` - Results table container
- `.result-row` - Table row
- `.selected-row` - Selected row state
- `.error-message` - Error display area
- `.loading-container` - Loading state display

## Error Handling

The component handles:
- Network errors
- API errors with custom messages
- Empty search results
- Invalid form inputs
- Loading states with spinner

## Testing

Run unit tests:
```bash
npm test
```

Test coverage includes:
- Service HTTP calls
- Component initialization
- Dialog interaction
- Row selection
- Search functionality
- Error scenarios
- Submit/cancel operations

## Dependencies

- Angular 21+
- Angular Material
- Angular Forms (Reactive Forms)
- RxJS
- Angular CDK (for scrolling)

## File Structure

```
entity-search/
├── entity-search.component.ts
├── entity-search.component.html
├── entity-search.component.css
├── entity-search.component.spec.ts
├── entity-search.service.ts
├── entity-search.service.spec.ts
├── entity-search-dialog/
│   ├── entity-search-dialog.component.ts
│   ├── entity-search-dialog.component.html
│   ├── entity-search-dialog.component.css
│   └── entity-search-dialog.component.spec.ts
└── README.md
```

## Example Integration

```typescript
// farm-owner-registration.component.ts
import { EntitySearchComponent } from './entity-search/entity-search.component';
import { FarmOwnerSearchResult } from './entity-search/entity-search.service';

@Component({
  selector: 'app-farm-owner-registration',
  standalone: true,
  imports: [EntitySearchComponent, ...otherImports],
  template: `
    <div class="registration-form">
      <h2>Register New Farm</h2>
      
      <div class="owner-selection">
        <label>Select Farm Owner:</label>
        <app-entity-search 
          [entityType]="'FarmOwner'"
          (selectedEntity)="onOwnerSelected($event)">
        </app-entity-search>
      </div>

      @if (selectedOwner) {
        <p>Selected Owner: {{ selectedOwner.name }} ({{ selectedOwner.contactNumber }})</p>
      }
    </div>
  `
})
export class FarmOwnerRegistrationComponent {
  selectedOwner: FarmOwnerSearchResult | null = null;

  onOwnerSelected(owner: FarmOwnerSearchResult) {
    this.selectedOwner = owner;
    // Proceed with registration using this owner's data
  }
}
```

## Notes

- The component is fully standalone and does not require NgModule
- All Material icons must be imported in the app
- The component uses Angular 21+ signals for state management
- Change detection is set to OnPush for optimal performance
- The dialog width is responsive and adjusts for mobile screens
