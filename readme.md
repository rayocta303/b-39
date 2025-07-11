# Lampubiled.id

A Progressive Web Application (PWA) for uploading animations to BLE-enabled LED display devices. This application provides a modern, user-friendly interface for managing LED animations, device configuration, and license management.

## 🚀 Features

- **Bluetooth Low Energy (BLE) Communication**: Connect and communicate with LED devices
- **Animation Gallery**: Browse and select from a library of LED animations
- **License Management**: Support for multiple license types (Basic, Standard, Full)
- **Vendor System**: Multi-vendor support with custom branding
- **Progressive Web App**: Installable on mobile devices with offline support
- **Advanced Caching**: IndexedDB-based caching for optimal performance
- **Real-time Upload**: Progress tracking for file uploads
- **Debug Tools**: Comprehensive debugging interface for developers

## 📁 Project Structure

```
├── api/                    # API endpoints and data files
├── assets/                 # Static assets (images, sounds, modules)
│   ├── modules/           # JavaScript modules
│   ├── logo/              # Logos and branding
│   ├── sounds/            # Audio feedback files
│   └── gif/               # Animation preview files
├── data/                  # Sample animation data
├── icons/                 # PWA icons
├── main.js                # Main application entry point
├── index.html             # Main HTML file
├── styles.css             # Application styles
└── serviceWorker.js       # PWA service worker
```

## 🔧 Module Documentation

### Core Modules (`assets/modules/`)

#### 1. `bleManager.js` - Bluetooth Communication

**Purpose**: Handles all Bluetooth Low Energy communication with devices.

**Key Functions**:

- `connectBLE()`: Establishes BLE connection to device
- `sendBLEPayload(payload)`: Sends data to connected device
- `readBLEData()`: Reads response data from device
- `updateStatus(text, connected)`: Updates connection status UI
- `appendLog(message)`: Adds log entries to UI

**Key Variables**:

- `bleDevice`: Current connected BLE device
- `bleCharacteristic`: BLE characteristic for communication
- `SERVICE_UUID`: BLE service identifier
- `CHARACTERISTIC_UUID`: BLE characteristic identifier

**Usage Example**:

```javascript
import { connectBLE, sendBLEPayload } from "./bleManager.js";

// Connect to device
const connected = await connectBLE();
if (connected) {
  await sendBLEPayload("info"); // Request device info
}
```

#### 2. `gallery.js` - Animation Management

**Purpose**: Manages the animation gallery, filtering, and selection system.

**Key Functions**:

- `loadGalleryData(filters)`: Loads animation data from API
- `renderGallery(filter)`: Renders filtered gallery items
- `selectGif(gif, isDefault)`: Selects animation for upload
- `updateUserContext(sn, vendor, license)`: Updates user filtering context
- `getFilteredGalleryData()`: Applies license/ownership filters
- `hasLicenseAccess(licenseType)`: Checks user license permissions
- `isOwnedByUser(animation)`: Checks animation ownership

**Key Variables**:

- `galleryData`: Array of all available animations
- `currentSerialNumber`: User's device serial number
- `currentVendorCode`: User's vendor code
- `currentLicenseType`: User's license level
- `window.selectedGifMeta`: Currently selected animation metadata

**Cache System**:

- Uses IndexedDB for animation and header caching
- Implements lazy loading with skeleton placeholders
- Supports offline browsing

**Usage Example**:

```javascript
import { updateUserContext, selectGif } from "./gallery.js";

// Update user context for filtering
updateUserContext("SN123456", "VENDOR01", "02");

// Select an animation
selectGif(animationObject, false);
```

#### 3. `upload.js` - File Upload Management

**Purpose**: Handles uploading animation headers to BLE devices with progress tracking.

**Key Functions**:

- `uploadGif(name, side, byteArray)`: Main upload function
- Progress tracking with detailed chunk information
- File validation (checks for #define and PROGMEM)
- Error handling and user feedback

**Upload Process**:

1. Validates file content
2. Shows progress modal
3. Sends start command (`awala` or `awalb`)
4. Uploads data in 512-byte chunks
5. Sends end command (`akhira` or `akhirb`)
6. Updates progress bar and provides feedback

**Usage Example**:

```javascript
import { uploadGif } from "./upload.js";

const content = "// Animation header content...";
const byteArray = new TextEncoder().encode(content);
await uploadGif("animation.h", "LEFT", byteArray);
```

#### 4. `license.js` - License Management

**Purpose**: Manages device licensing and vendor detection.

**Key Functions**:

- `requestDeviceInfo()`: Gets device info and license status
- `submitLisensi(code)`: Activates license with provided code
- `resetLisensi()`: Resets device license
- Vendor detection from serial numbers and license codes
- Updates gallery context based on license level

**License Types**:

- `00`: No License
- `01`: Basic License
- `02`: Standard License
- `03`: Full License

**Usage Example**:

```javascript
import { requestDeviceInfo, submitLisensi } from "./license.js";

// Get device info
await requestDeviceInfo();

// Activate license
await submitLisensi("LICENSE-CODE-123");
```

#### 5. `vendor.js` - Vendor Management

**Purpose**: Handles vendor-specific branding and filtering.

**Key Functions**:

- `loadVendorsFromAPI()`: Loads vendor data from API
- `getVendorInfo(vendorCode)`: Gets vendor information
- `updateVendorLogo(vendorCode)`: Updates logo based on vendor
- `detectVendor({serialNumber, lisensiCode})`: Detects vendor from device info
- `parseVendorFromSN(serial)`: Extracts vendor from serial number

**Vendor Detection Logic**:

- Serial format: `SN123456+VENDOR`
- License format: `CODE123+VENDOR`
- Falls back to "GENERIC" if no vendor detected

**Usage Example**:

```javascript
import { updateVendorLogo, getVendorInfo } from "./vendor.js";

// Update logo for vendor
updateVendorLogo("VENDOR01");

// Get vendor information
const vendor = getVendorInfo("VENDOR01");
console.log(vendor.name, vendor.contact);
```

#### 6. `config.js` - Configuration Management

**Purpose**: Manages application configuration and API environments.

**Key Functions**:

- `setApiEnvironment(env)`: Switch between development/production
- `getApiEndpoint(name)`: Get API endpoint URLs
- `setCacheEnabled(status)`: Enable/disable caching
- `setDebugEnabled(enabled)`: Control debug mode
- `debugLog(type, message, data)`: Conditional debug logging

**Environment Settings**:

- Development: Uses JSON files
- Production: Uses PHP endpoints with server-side filtering

**Debug Categories**:

- `api`: API call logging
- `cache`: Cache operation logging
- `filter`: Filter operation logging

**Usage Example**:

```javascript
import { setApiEnvironment, debugLog } from "./config.js";

// Switch to production mode
setApiEnvironment("production");

// Debug logging
debugLog("api", "Loading gallery data", { count: 10 });
```

#### 7. `cache.js` - Advanced Caching System

**Purpose**: Provides IndexedDB-based caching for animations and headers.

**Key Classes**:

- `CacheManager`: Main cache management class

**Key Functions**:

- `getCachedAnimation(url)`: Get cached animation
- `getCachedHeader(url)`: Get cached header file
- `preloadAssets(galleryData)`: Preload gallery assets
- `clearAllCache()`: Clear all cached data

**Cache Features**:

- Automatic cache invalidation based on Last-Modified headers
- Efficient blob URL management for images
- Chunked loading to prevent browser overload
- Cache size monitoring

**Usage Example**:

```javascript
import { getCachedAnimation, preloadAssets } from "./cache.js";

// Get cached animation
const animationUrl = await getCachedAnimation("/data/1.gif");

// Preload all gallery assets
await preloadAssets(galleryData);
```

#### 8. `servo.js` - Servo Control

**Purpose**: Controls servo motors for LED display positioning.

**Key Functions**:

- `setServo(min, max, side)`: Set servo position range
- `format3Digit(num)`: Format numbers to 3 digits

**Commands**:

- Left servo: `servo{min}{max}` (e.g., `servo045135`)
- Right servo: `rservo{min}{max}` (e.g., `rservo045135`)

**Usage Example**:

```javascript
import { setServo } from "./servo.js";

// Set left servo range
await setServo(45, 135, "L");

// Set right servo range
await setServo(45, 135, "R");
```

#### 9. `toast.js` - User Feedback

**Purpose**: Provides toast notifications and audio feedback.

**Key Functions**:

- `showToast(message, type, duration)`: Show toast notification
- `playSound(path)`: Play audio feedback

**Toast Types**:

- `info`: Gray background
- `success`: Green background
- `warning`: Yellow background
- `error`: Red background

**Usage Example**:

```javascript
import { showToast, playSound } from "./toast.js";

// Show success toast
showToast("Upload successful!", "success");

// Play success sound
playSound("assets/sounds/success.mp3");
```

#### 10. `modal.js` - Modal Management

**Purpose**: Manages application modals for important messages.

**Key Functions**:

- `showModal({title, message, type})`: Display modal
- `hideModal(delay)`: Hide modal with optional delay

**Modal Types**:

- `info`: Information icon
- `success`: Check circle icon
- `warning`: Warning triangle icon
- `error`: Error circle icon

**Usage Example**:

```javascript
import { showModal, hideModal } from "./modal.js";

// Show warning modal
showModal({
  title: "Upload in Progress",
  message: "Please don't close the browser.",
  type: "warning",
});

// Hide after 3 seconds
hideModal(3000);
```

#### 11. `utils.js` - Utility Functions

**Purpose**: Provides utility functions for UI and theme management.

**Key Functions**:

- Theme-based logo switching
- Loading screen management
- Mobile scroll behavior for logo shrinking
- Welcome sound playback

## 🔌 API Structure

### Development Mode (JSON)

- `api/gallery.json`: Animation data
- `api/vendors.json`: Vendor information

### Production Mode (PHP)

- `api/gallery.php`: Server-side filtered animations
- `api/vendors.php`: Vendor data with authentication

### API Parameters (Production)

- `sn`: Serial number filter
- `license`: License type filter
- `vendor`: Vendor code filter
- `category`: Category filter
- `debug`: Enable debug information

## 📱 PWA Features

### Service Worker (`serviceWorker.js`)

- Caches static assets for offline use
- Implements cache-first strategy
- Handles cache updates and cleanup

### Manifest (`manifest.json`)

- Defines app metadata for installation
- Configures theme colors and icons
- Sets display mode and orientation

## 🛠️ Development Setup

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd ble-uploader
   ```

2. **Start Development Server**

   ```bash
   python -m http.server 5000
   ```

3. **Access Application**
   - Local: `http://localhost:5000`
   - Network: `http://0.0.0.0:5000`

## 🔧 Configuration

### Environment Switching

Use the debug panel to switch between development and production modes:

- Development: Uses local JSON files
- Production: Uses PHP APIs with server-side filtering

### Debug Features

Access debug panel via:

- Desktop: FAB debug button
- Mobile: Bottom toolbar debug button
- Keyboard: `Ctrl+D`

## 📊 Data Flow

1. **App Initialization**:

   - Load vendors from API
   - Initialize cache system
   - Set up PWA features

2. **Device Connection**:

   - BLE connection establishment
   - Device info retrieval
   - License validation
   - Vendor detection

3. **Gallery Loading**:

   - Apply user context filters
   - Load animations based on permissions
   - Cache assets for offline use

4. **Animation Selection**:

   - Load header files
   - Update preview
   - Prepare for upload

5. **Upload Process**:
   - Validate content
   - Show progress
   - Send data in chunks
   - Provide feedback

## 🚀 Deployment

This application is designed to run on Replit with automatic deployment:

- Static files served via Python HTTP server
- PWA features work in production
- Service worker handles caching

## 🔍 Debugging

### Debug Panel Features

- Device information display
- Gallery context monitoring
- File preview and validation
- Cache status and management
- API call logging

### Console Logging

- BLE communication logs
- Cache operation logs
- API request/response logs
- Error tracking and reporting

## 📄 License

This project is developed for Lampubiled.id. All rights reserved.
