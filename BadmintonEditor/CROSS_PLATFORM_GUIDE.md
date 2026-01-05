# Cross-Platform Development Guide

This document outlines the strategy for expanding the Badminton Video Editor to mobile and desktop platforms.

## Architecture Overview

The current web application serves as the foundation for all platforms:

```
┌─────────────────────────────────────────────────┐
│           Shared Business Logic                 │
│  (React Components, State Management, API)      │
└─────────────────────────────────────────────────┘
           │              │              │
    ┌──────▼────┐  ┌──────▼────┐  ┌─────▼─────┐
    │    Web    │  │  Mobile   │  │  Desktop  │
    │  (Vite)   │  │  (RN/RNW) │  │ (Electron)│
    └───────────┘  └───────────┘  └───────────┘
```

## Mobile Development (React Native)

### Approach: React Native with React Native Web

Using React Native with React Native Web allows maximum code reuse:

1. **Shared Components** (~80% code reuse)
   - Convert existing React components to React Native components
   - Use platform-specific code only where necessary

2. **Setup Steps**

```bash
# Create React Native project
npx react-native init BadmintonEditorMobile
cd BadmintonEditorMobile

# Install React Native Web
npm install react-native-web

# Install cross-platform video library
npm install react-native-video

# Install navigation
npm install @react-navigation/native
```

3. **Component Mapping**

| Web Element | React Native Equivalent |
|-------------|-------------------------|
| `<div>`     | `<View>`               |
| `<span>`    | `<Text>`               |
| `<button>`  | `<TouchableOpacity>`   |
| `<input>`   | `<TextInput>`          |
| `<video>`   | `<Video>` (react-native-video) |

4. **Platform-Specific Features**

```javascript
import { Platform } from 'react-native'

const styles = StyleSheet.create({
  container: {
    padding: Platform.OS === 'ios' ? 20 : 16,
    ...Platform.select({
      ios: { shadowRadius: 2 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
    })
  }
})
```

5. **Native Capabilities**
   - Camera integration for direct recording
   - Local file system access
   - Background video processing
   - Push notifications for export completion

### File Structure for React Native

```
BadmintonEditorMobile/
├── src/
│   ├── components/          # Shared components
│   │   ├── VideoUploader/
│   │   │   ├── index.js
│   │   │   ├── index.web.js  # Web-specific
│   │   │   └── index.native.js  # Native-specific
│   │   └── ...
│   ├── screens/             # Screen containers
│   ├── navigation/          # Navigation setup
│   └── services/            # API calls
├── ios/                     # iOS native code
├── android/                 # Android native code
└── package.json
```

## Desktop Development (Electron)

### Approach: Electron Wrapper

Package the existing web application with Electron for desktop distribution:

1. **Setup Steps**

```bash
cd badminton-editor-web

# Install Electron
npm install --save-dev electron electron-builder

# Install additional packages
npm install electron-store  # For persistent storage
```

2. **Add Electron Configuration**

Create `electron/main.js`:

```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile('dist/index.html')
  }
}

app.whenReady().then(createWindow)
```

3. **Update package.json**

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.badmintoneditor.app",
    "files": ["dist/**/*", "electron/**/*"],
    "mac": {
      "category": "public.app-category.video"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

4. **Desktop-Specific Features**
   - Native file dialogs
   - Menu bar integration
   - System notifications
   - Better performance for large videos
   - Offline functionality

### File Structure for Electron

```
badminton-editor-web/
├── src/                     # React app (unchanged)
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script
│   └── menu.js              # Application menu
├── dist/                    # Built web app
└── package.json             # Updated with Electron scripts
```

## Shared Backend Integration

All platforms will connect to the same FastAPI backend:

1. **API Client Setup**

```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

export const uploadVideo = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  })
  
  return response.json()
}
```

2. **Environment Configuration**

```bash
# Web (.env)
REACT_APP_API_URL=http://localhost:8000

# Mobile (different for each platform)
REACT_APP_API_URL=https://api.badmintoneditor.com

# Desktop (local server)
REACT_APP_API_URL=http://localhost:8000
```

## Development Workflow

### 1. Component Development
- Start with web version (fastest iteration)
- Test in browser
- Adapt for mobile if needed
- Package for desktop

### 2. Testing Strategy
- **Web**: Browser testing (Chrome, Firefox, Safari)
- **Mobile**: iOS Simulator, Android Emulator, Real devices
- **Desktop**: Test on Windows, macOS, Linux

### 3. Deployment

#### Web
```bash
npm run build
# Deploy dist/ to hosting (Netlify, Vercel, etc.)
```

#### Mobile
```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

#### Desktop
```bash
npm run electron:build
# Creates installers in dist/
```

## Code Sharing Strategy

To maximize code reuse:

1. **Shared Logic** (100% reuse)
   - API calls
   - State management
   - Business logic
   - Utilities

2. **Shared Components** (80% reuse)
   - UI components with platform adaptations
   - Use conditional rendering for platform differences

3. **Platform-Specific** (unique per platform)
   - Navigation structure
   - File handling
   - Native features

## Next Steps

### Phase 1: Prepare for Mobile
1. Refactor components to be platform-agnostic
2. Move inline styles to StyleSheet-compatible format
3. Replace DOM-specific APIs with cross-platform alternatives

### Phase 2: Mobile MVP
1. Set up React Native project
2. Port core components
3. Implement mobile-specific navigation
4. Add camera integration

### Phase 3: Desktop App
1. Add Electron configuration
2. Create application menu
3. Implement file system integration
4. Build and test installers

### Phase 4: Feature Parity
1. Ensure all features work on all platforms
2. Optimize performance per platform
3. Add platform-specific enhancements

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Electron Documentation](https://www.electronjs.org/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Electron Builder](https://www.electron.build/)

## Conclusion

The current web application is architected to support easy expansion to mobile and desktop platforms. The modular component structure and clean separation of concerns make it straightforward to adapt the codebase for multiple platforms while maintaining a single source of truth for business logic.
