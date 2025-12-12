# Crop Farm Selector - Quick Reference

## 📁 File Locations

All files are located in: `src/app/crop-farm-selector/`

## 🎯 Core Files

| File | Purpose |
|------|---------|
| `crop-farm-selector.service.ts` | Service with state management and search logic |
| `crop-farm-selector-dialog.component.ts` | Dialog component for search and selection |
| `crop-farm-selector-toolbar.component.ts` | Toolbar component for displaying selection |

## 📋 Template & Style Files

| File | Purpose |
|------|---------|
| `crop-farm-selector-dialog.component.html` | Dialog UI template |
| `crop-farm-selector-dialog.component.css` | Dialog styling |
| `crop-farm-selector-toolbar.component.html` | Toolbar UI template |
| `crop-farm-selector-toolbar.component.css` | Toolbar styling |

## 🧪 Test Files

| File | Purpose |
|------|---------|
| `crop-farm-selector.service.spec.ts` | Service unit tests |
| `crop-farm-selector-dialog.component.spec.ts` | Dialog component tests |
| `crop-farm-selector-toolbar.component.spec.ts` | Toolbar component tests |

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Comprehensive component documentation |
| `../IMPLEMENTATION_SUMMARY.md` | Full implementation summary |

## 🔧 Integration Files Modified

| File | Changes |
|------|---------|
| `src/app/app.component.ts` | Added toolbar component import |
| `src/app/app.component.html` | Added toolbar component to header |
| `src/app/app.component.css` | Updated header layout for toolbar placement |

---

## 🚀 Quick Start

### 1. Service Injection (in any component)
```typescript
constructor(private selectorService: CropFarmSelectorService) {}
```

### 2. Access Selection
```typescript
// Get individual signals
const farmId = this.selectorService.selectedFarmId();
const cropName = this.selectorService.selectedCropName();

// Get complete selection object
const selection = this.selectorService.selectedCropFarm();
```

### 3. Watch for Changes
```typescript
import { effect } from '@angular/core';

effect(() => {
  const selected = this.selectorService.selectedCropFarm();
  if (selected) {
    // React to selection changes
  }
});
```

---

## 🎨 Visual Hierarchy

```
App Root (app.component.ts)
  ├── Header
  │   ├── Brand Name (h1)
  │   └── Crop Farm Selector Toolbar (top-right)
  │       ├── No Selection State
  │       │   └── [+] Add button
  │       └── Selection State
  │           ├── Farm Name [Edit] [Clear]
  │           └── Crop Name [Edit] [Clear]
  │
  └── Dialog (Modal)
      ├── Search Input Field
      ├── Results Table
      │   ├── Farm Name
      │   ├── Farm ID
      │   ├── Crop Name
      │   ├── Crop ID
      │   └── [Select] Button
      └── Cancel Button
```

---

## 💾 Storage

**Type**: sessionStorage  
**Key**: `'selectedCropFarm'`  
**Format**: JSON object with `{ farmId, cropId, farmName, cropName }`  
**Lifecycle**: Persists across page refresh (within same session)  

---

## 🔌 API Endpoints Required

```
GET /api/Farm/search?query=<searchQuery>
GET /api/Crop/search?query=<searchQuery>
```

Expected response format documented in README.md

---

## ✅ Implementation Checklist

- ✅ Service with signal-based state management
- ✅ Dialog component with Material table
- ✅ Toolbar component in app header
- ✅ Search functionality with debouncing
- ✅ Result display and selection
- ✅ Persistent state management
- ✅ Responsive design
- ✅ Comprehensive tests
- ✅ Full documentation
- ✅ No compilation errors

---

## 📝 Testing

```bash
# Run unit tests
ng test

# Run specific test file
ng test --include='**/crop-farm-selector*.spec.ts'

# Run with coverage
ng test --code-coverage
```

---

## 🐛 Troubleshooting

### Selection not displaying in toolbar?
- Check if CropFarmSelectorToolbarComponent is imported in app.component.ts
- Verify component is added to template
- Check browser console for errors

### Dialog not opening?
- Ensure MatDialog is available
- Check that button click handler is working
- Verify CropFarmSelectorDialogComponent is provided

### Search returning no results?
- Verify API endpoints are correct
- Check API response format matches expected structure
- Test with known crop/farm IDs

### State not persisting?
- Check if sessionStorage is enabled in browser
- Verify service is provided as singleton (it is by default)
- Check browser DevTools storage tab

---

## 📚 Related Documentation

- [Angular 21 Signals Guide](https://angular.io/guide/signals)
- [Angular Material Dialog](https://material.angular.io/components/dialog)
- [Angular Standalone Components](https://angular.io/guide/standalone-components)
- [RxJS Operators](https://rxjs.dev/guide/operators)

---

## 👤 Component Author Notes

- Built with Angular 21+ standalone component pattern
- Uses modern signals for state management
- Material Design for consistent UI
- Fully typed with TypeScript
- Comprehensive test coverage
- Production-ready code

---

**Last Updated**: December 11, 2025  
**Angular Version**: 21+  
**Material Version**: 21+
