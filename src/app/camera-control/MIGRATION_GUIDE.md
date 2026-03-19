# Migration Guide: Using Camera Control Component

This guide shows how to migrate from inline camera code to the reusable `CameraControlComponent`.

## Quick Start

### Before (Inline Camera Code)

```typescript
// Inside add-activity.component.ts - lots of camera logic mixed with form logic
export class AddActivityComponent {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  capturedPhoto: string | null = null;
  cameraMode = false;
  private mediaStream: MediaStream | null = null;
  
  async openCamera() { /* ... */ }
  private startCameraStream() { /* ... */ }
  capturePhoto() { /* ... */ }
  stopCamera() { /* ... */ }
}
```

### After (Using CameraControlComponent)

```typescript
// Inside add-activity.component.ts - clean, focused on activity logic
import { CameraControlComponent, CameraControlOutput } from '@app/camera-control/camera-control.component';

@Component({
  imports: [CameraControlComponent],
  template: `
    <app-camera-control [allowUpload]="true" (photoCapture)="onPhotoCaptured($event)"></app-camera-control>
  `
})
export class AddActivityComponent {
  onPhotoCaptured(output: CameraControlOutput) {
    if (output.success && output.filePath) {
      // Use the uploaded photo path
      this.activityForm.patchValue({ photoPath: output.filePath });
    }
  }
}
```

## Step-by-Step Migration

### Step 1: Update Component Imports

**REMOVE:**
```typescript
import { MatTooltipModule } from '@angular/material/tooltip';
// ... camera-related ViewChild declarations
private mediaStream: MediaStream | null = null;
private cameras: MediaDeviceInfo[] = [];
// ... all camera methods
```

**ADD:**
```typescript
import { CameraControlComponent, CameraControlOutput } from '@app/camera-control/camera-control.component';
```

### Step 2: Add to Component Imports

```typescript
@Component({
  imports: [
    // ... existing imports
    CameraControlComponent  // Add this
  ]
})
```

### Step 3: Update Template

**REMOVE:** All camera-related HTML:
```html
<!-- Remove all this -->
<div class="camera-section">
  <div class="camera-stream-container">
    <video #videoElement></video>
    <!-- ... all camera controls ... -->
  </div>
</div>
```

**ADD:**
```html
<!-- Replace with this single line -->
<app-camera-control 
  [allowUpload]="true"
  (photoCapture)="onPhotoCaptured($event)">
</app-camera-control>
```

### Step 4: Add Output Handler

```typescript
onPhotoCaptured(output: CameraControlOutput) {
  if (output.success) {
    if (output.filePath) {
      // When allowUpload = true
      this.activityForm.patchValue({ photoPath: output.filePath });
    } else if (output.fileBlob) {
      // When allowUpload = false (if needed)
      this.handlePhotoBlob(output.fileBlob, output.filename);
    }
  } else {
    console.error('Photo capture failed:', output.message);
  }
}
```

### Step 5: Update CSS

**REMOVE:** All camera-related CSS classes:
```css
/* Remove these */
.camera-section { }
.camera-stream-container { }
.video-stream { }
.capture-btn { }
/* ... etc ... */
```

The component brings its own encapsulated styles, so no CSS updates needed!

## Usage Patterns

### Pattern 1: Simple Photo Capture (Server Upload)

```typescript
@Component({
  template: `
    <app-camera-control [allowUpload]="true" (photoCapture)="onPhoto($event)"></app-camera-control>
  `,
  imports: [CameraControlComponent]
})
export class SimplePhotoComponent {
  onPhoto(output: CameraControlOutput) {
    if (output.success && output.filePath) {
      console.log('Photo saved at:', output.filePath);
    }
  }
}
```

### Pattern 2: Multiple Photo Fields

```typescript
@Component({
  template: `
    <div class="photo-section">
      <h3>Frontal View</h3>
      <app-camera-control 
        [allowUpload]="true"
        (photoCapture)="onFrontalPhoto($event)">
      </app-camera-control>

      <h3>Side View</h3>
      <app-camera-control 
        [allowUpload]="true"
        (photoCapture)="onSidePhoto($event)">
      </app-camera-control>
    </div>
  `,
  imports: [CameraControlComponent]
})
export class MultiplePhotosComponent {
  frontalPhotoPath: string = '';
  sidePhotoPath: string = '';

  onFrontalPhoto(output: CameraControlOutput) {
    if (output.success && output.filePath) {
      this.frontalPhotoPath = output.filePath;
    }
  }

  onSidePhoto(output: CameraControlOutput) {
    if (output.success && output.filePath) {
      this.sidePhotoPath = output.filePath;
    }
  }
}
```

### Pattern 3: Conditional Upload (Parent Controls Upload)

```typescript
@Component({
  template: `
    <app-camera-control 
      [allowUpload]="false"
      (photoCapture)="onPhoto($event)">
    </app-camera-control>
    <button (click)="submitForm()">Submit with Photo</button>
  `,
  imports: [CameraControlComponent, MatButtonModule]
})
export class FormWithPhotoComponent {
  photoBlob: Blob | null = null;
  photoName: string = '';

  onPhoto(output: CameraControlOutput) {
    if (output.success && output.fileBlob) {
      this.photoBlob = output.fileBlob;
      this.photoName = output.filename || 'photo.jpg';
    }
  }

  submitForm() {
    if (this.photoBlob) {
      const formData = new FormData();
      formData.append('photo', this.photoBlob, this.photoName);
      // Send to API
    }
  }
}
```

## Backward Compatibility

The new component is independent. You can keep old implementations and migrate gradually:

1. **Keep old add-activity component** as-is (working)
2. **Create new components** using CameraControlComponent
3. **Gradually migrate** existing components over time

## Benefits of Migration

| Aspect | Before | After |
|--------|--------|-------|
| Lines of Code | 300+ (camera logic) | ~5 (component usage) |
| Reusability | Only in add-activity | Everywhere in app |
| Maintenance | Scattered across component | Centralized |
| Testing | Manual | Automated unit tests |
| Consistency | Different patterns | Uniform interface |

## Troubleshooting

### Component not displaying

```typescript
// Make sure it's imported in parent component
@Component({
  imports: [CameraControlComponent]  // ✅ Required
})
```

### Upload endpoint not found

First, verify the upload endpoint exists:
```typescript
// In camera-control.component.ts
const uploadUrl = '/api/upload'; // Update to your actual endpoint
```

### Output event not firing

Make sure you're handling the event:
```html
<!-- Correct -->
<app-camera-control (photoCapture)="onPhotoCaptured($event)"></app-camera-control>

<!-- Incorrect -->
<app-camera-control (photoCapture)="onPhotoCaptured()"></app-camera-control>
```

## Summary

The camera-control component provides:
- ✅ Extracted, reusable logic
- ✅ Consistent interface across app
- ✅ Better maintainability
- ✅ Cleaner component code
- ✅ Built-in error handling
- ✅ Mobile optimization

Migrate at your own pace. Both approaches work equally well!
