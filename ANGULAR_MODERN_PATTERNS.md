# Modern Angular 21+ Patterns Reference

## Used in Crop Farm Selector

Quick reference guide for modern patterns applied in the crop-farm-selector component system.

---

## 1. Signal-Based State Management

### Creating Signals
```typescript
private searchResultsSignal = signal<CropOption[]>([]);
```

### Accessing Signals
```typescript
const results = this.searchResultsSignal(); // No .value needed
```

### Updating Signals
```typescript
this.searchResultsSignal.set(newResults);
```

### Read-Only Signal Access
```typescript
getSearchResultsSignal() {
  return this.searchResultsSignal.asReadonly();
}
```

---

## 2. Computed (Derived) Values

### Creating Computed Signal
```typescript
selectedCropFarm = computed(() => {
  const farmId = this.selectedFarmIdSignal();
  const cropId = this.selectedCropIdSignal();
  // ... logic
  return { farmId, cropId, ... };
});
```

### Using Computed Values
```typescript
const selection = this.selectorService.selectedCropFarm();
```

---

## 3. Effect (Reactive Side Effects)

### Automatic Synchronization Pattern
```typescript
constructor() {
  effect(() => {
    const results = this.searchResultsSignal();
    this.searchResultsSubject.next(results); // Auto-sync
  });
}
```

### When to Use Effect
- Synchronizing signals with external systems
- Triggering API calls based on signal changes
- Updating DOM outside of component template
- Logging or analytics based on state changes

---

## 4. RxJS tap() Operator

### Modern Side-Effect Operator
```typescript
searchCropFarm(query: string): Observable<CropOption[]> {
  return this.http.get<any[]>(url).pipe(
    tap(options => this.searchResultsSignal.set(options)) // Side effect
  );
}
```

### When to Use tap()
- Performing side effects without modifying the stream
- Debugging observables
- Triggering state updates
- No return value modifies the stream

### vs map() (When NOT to use)
```typescript
// ❌ WRONG - Using map for side effects
map(options => {
  this.searchResultsSignal.set(options);
  return options;
})

// ✅ CORRECT - Using tap for side effects
tap(options => this.searchResultsSignal.set(options))
```

---

## 5. Modern Subscribe Pattern

### Object-Based Subscribe
```typescript
// ✅ MODERN (Recommended)
observable.subscribe({
  next: (value) => { /* handle value */ },
  error: (error) => { /* handle error */ },
  complete: () => { /* handle completion */ }
});
```

### Positional-Based Subscribe
```typescript
// ❌ DEPRECATED
observable.subscribe(
  (value) => { /* handle value */ },
  (error) => { /* handle error */ },
  () => { /* handle completion */ }
);
```

### Benefits
- Self-documenting: `next`, `error`, `complete` are explicit
- Better IDE support and TypeScript inference
- Easier to read and maintain
- Complies with RxJS documentation

---

## 6. takeUntil Pattern (Unsubscription)

### Setup Destroy Subject
```typescript
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    observable.pipe(
      takeUntil(this.destroy$)
    ).subscribe(/* ... */);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Benefits
- Cleaner than manual unsubscribe
- Works with multiple subscriptions
- Automatically completes all piped subscriptions

---

## 7. Hybrid Signal + Observable

### Why Both?
- **Signals**: Faster change detection, simpler syntax
- **Observables**: Async pipes in templates, RxJS ecosystem

### Synchronization Pattern
```typescript
// Signal (source of truth)
private mySignal = signal<Data[]>([]);

// Observable (for template or legacy code)
private mySubject = new BehaviorSubject<Data[]>([]);
myObservable$ = this.mySubject.asObservable();

// Keep in sync
constructor() {
  effect(() => {
    const data = this.mySignal();
    this.mySubject.next(data);
  });
}
```

### Usage
```typescript
// Modern code: Use signals directly
const data = this.service.mySignal();

// Template: Can use observable with async pipe
{{ service.myObservable$ | async | json }}

// Legacy code: Still works with observables
this.service.myObservable$.subscribe(...);
```

---

## 8. Standalone Components

### Component Definition
```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, MatIconModule, ...],
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.css']
})
export class MyComponent { }
```

### Key Features
- No NgModule needed
- Import dependencies directly in component
- Better tree-shaking
- Smaller bundles

---

## 9. Typed Reactive Forms

### Form Creation
```typescript
private fb: FormBuilder;

ngOnInit() {
  this.searchForm = this.fb.group({
    searchQuery: ['', Validators.required]
  });
}
```

### Accessing Form Values
```typescript
const query = this.searchForm.get('searchQuery')?.value;
```

### Form Value Changes
```typescript
this.searchForm.get('searchQuery')?.valueChanges
  .pipe(takeUntil(this.destroy$))
  .subscribe(value => {
    // React to changes
  });
```

---

## 10. Error Handling with catchError

### Pattern
```typescript
observable.pipe(
  // ... operations
  catchError(error => {
    console.error('Error:', error);
    return of([]); // Return fallback value
  })
);
```

### Alternative: Retry Logic
```typescript
observable.pipe(
  retry(3),
  catchError(error => {
    return of(null); // Fallback after retries
  })
);
```

---

## Common Patterns Summary

| Pattern | Use Case | Version |
|---------|----------|---------|
| **Signals** | Component state | 21+ |
| **Computed** | Derived state | 21+ |
| **Effect** | Side effects | 21+ |
| **tap()** | Observable side effects | Always |
| **catchError()** | Error handling | Always |
| **takeUntil()** | Auto-unsubscribe | Always |
| **Standalone** | Component definition | 14+ |

---

## Migration Checklist

When modernizing existing components:

- [ ] Replace `BehaviorSubject` with `signal()` for state
- [ ] Replace `map()` side effects with `tap()`
- [ ] Update subscribe calls to object notation
- [ ] Add `takeUntil` for subscription cleanup
- [ ] Use `computed()` for derived state
- [ ] Add `effect()` for cross-cutting concerns
- [ ] Update tests for new patterns
- [ ] Document API changes
- [ ] Provide migration guide

---

## Resources

- [Angular Signals Guide](https://angular.io/guide/signals)
- [RxJS Best Practices](https://rxjs.dev/guide/operators)
- [Standalone Components](https://angular.io/guide/standalone-components)
- [Reactive Forms](https://angular.io/guide/reactive-forms)

---

**Last Updated**: December 11, 2025  
**Angular Version**: 21+  
**RxJS Version**: 7+
