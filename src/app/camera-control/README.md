# Camera Control Component

A reusable standalone Angular component for capturing photos using the device camera with support for multiple cameras, gallery selection, and optional server-side upload.

## Features

✅ **Multi-Camera Support**
- Automatically detects all available cameras on the device
- Defaults to back camera if available
- Falls back to first camera if no back camera exists
- Supports single-camera devices seamlessly

✅ **Live Camera Stream**
- Real-time video preview with proper playback
- Smooth camera switching with dedicated button
- Close button to exit camera mode
- Proper resource cleanup on exit

✅ **Photo Capture**
- Capture photos from current camera feed
- Result displayed with preview thumbnail
- Generated filename: `photo_${timestamp}.jpg`

✅ **Gallery Integration**
- Pick existing photos from device gallery
- Same preview interface as camera capture
- Supports all device-supported image formats

✅ **Upload Control**
- Optional server-side upload via `allowUpload` input
- Configurable upload endpoint
- Client-side blob option for parent-managed upload
- Proper error handling and user feedback

✅ **Mobile Optimized**
- Responsive layout for all screen sizes
- Touch-friendly buttons and controls
- Auto-scaling video stream
- Concise UI without video recording options

✅ **Security**
- No video recording capability (image capture only)
- Proper media stream cleanup
- No persistent file storage

## Installation

Import the component in your module or parent component:

```typescript
import { CameraControlComponent } from './camera-control/camera-control.component';

@Component({
  selector: 'app-my-component',
  imports: [CameraControlComponent],
  template: `
    <app-camera-control 
      [allowUpload]="true"
      (photoCapture)="onPhotoCaptured($event)">
    </app-camera-control>
  `
})
export class MyComponent {}
```

## Usage

### Basic Usage (With Server Upload)

```typescript
import { CameraControlComponent, CameraControlOutput } from '@app/camera-control/camera-control.component';

@Component({
  selector: 'app-activity-form',
  imports: [CameraControlComponent],
  template: `
    <app-camera-control 
      [allowUpload]="true"
      (photoCapture)="handlePhotoCapture($event)">
    </app-camera-control>
  `
})
export class ActivityFormComponent {
  handlePhotoCapture(output: CameraControlOutput) {
    if (output.success) {
      console.log('Photo uploaded to:', output.filePath);
      // Use the uploaded file path in your form
    } else {
      console.error('Photo capture failed:', output.message);
    }
  }
}
```

### Client-Side Upload (Parent Handles Upload)

```typescript
@Component({
  selector: 'app-observation-form',
  imports: [CameraControlComponent],
  template: `
    <app-camera-control 
      [allowUpload]="false"
      (photoCapture)="handlePhotoCapture($event)">
    </app-camera-control>
  `
})
export class ObservationFormComponent {
  handlePhotoCapture(output: CameraControlOutput) {
    if (output.success && output.fileBlob) {
      const formData = new FormData();
      formData.append('photo', output.fileBlob, output.filename);
      // Parent handles the upload with custom logic
      this.uploadToCustomEndpoint(formData);
    }
  }

  uploadToCustomEndpoint(formData: FormData) {
    // Your custom upload logic
  }
}
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `allowUpload` | `boolean` | `true` | If true, component uploads file to server; if false, returns blob for parent to handle |

## Output Events

### photoCapture Event

Emits a `CameraControlOutput` object containing:

```typescript
interface CameraControlOutput {
  success: boolean;           // Whether operation succeeded
  message: string;            // Status/error message
  filePath?: string;          // Server file path (if allowUpload=true)
  filename?: string;          // Original/generated filename
  fileBlob?: Blob;           // File blob (if allowUpload=false)
}
```

### When `allowUpload = true`:
```typescript
{
  success: true,
  message: "Photo uploaded successfully",
  filePath: "/uploads/photos/photo_1234567890.jpg"
}
```

### When `allowUpload = false`:
```typescript
{
  success: true,
  message: "Photo captured",
  filename: "photo_1234567890.jpg",
  fileBlob: Blob { size: 45678, type: "image/jpeg" }
}
```

## Configuration

### Upload Endpoint

The default upload endpoint is `/api/upload`. To change it, modify the `uploadUrl` in the component's `uploadPhoto()` method:

```typescript
private uploadUrl = '/custom/upload/endpoint';
```

Expected server response format:
```json
{
  "filePath": "/path/to/uploaded/file.jpg",
  "path": "/path/to/uploaded/file.jpg"
}
```

## Component Behavior

### Camera Selection
1. **Multiple Cameras**: Detects all cameras, defaults to back camera
   - Shows "Switch Camera" button during live stream
   - Cycles through cameras on each click
   - Properly handles facingMode ('environment' for back, 'user' for front)

2. **Single Camera**: Uses the only available camera
   - Switch button not shown
   - Works exactly like any other camera

3. **No Cameras**: Shows error message
   - "No camera found on this device"
   - User can still select from gallery

### States

1. **Initial State**: Two buttons visible
   - "Open Camera" button
   - "Gallery" button

2. **Camera Live State**: Video stream with controls
   - Large red capture button (center)
   - Switch camera button (if multiple cameras)
   - Close button

3. **Photo Preview State**: Captured/selected photo
   - Photo preview with thumbnails
   - "Upload" or "Confirm" button (depends on allowUpload)
   - "Retake" button to return to controls

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support (iOS 14.5+)
- Mobile Browsers: ✅ Full support

## Permissions

The component requires these browser permissions:
- **Camera Access**: Requested when opening camera
- **File Access**: Requested when picking from gallery

## Error Handling

All errors are handled gracefully with user-friendly messages:

| Error | User Message |
|-------|--------------|
| No cameras found | "No camera found on this device" |
| Camera permission denied | "Unable to access camera. Please check permissions." |
| Video playback failed | Shows in browser console; user can retry |
| Upload failed | "Error uploading photo. Please try again." |
| Camera stream error | "Camera error occurred" |

## Performance Considerations

- Media stream properly cleaned up on component destroy
- Video playback optimized with timeouts and retry logic
- Blob conversion optimized with 95% JPEG quality
- No memory leaks on camera switch or retake

## Security Notes

⚠️ **Important**: 
- Update the upload endpoint URL to your actual server
- Implement server-side file validation and authorization
- Never trust client-provided filenames
- Validate file size and MIME type on server
- Store uploaded files outside web root
- Implement proper access controls for file retrieval
