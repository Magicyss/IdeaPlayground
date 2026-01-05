# 🏸 Badminton Video Editor

A cross-platform video editing application that automatically segments badminton matches by detecting serves and scores, allows court selection for multi-court recordings, and generates personal highlight reels using AI-powered analysis.

![Platform Support](https://img.shields.io/badge/platform-web%20%7C%20mobile%20%7C%20desktop-blue)
![React](https://img.shields.io/badge/react-19.2.0-blue)
![Python](https://img.shields.io/badge/python-3.8%2B-green)

## 🌟 Features

### Current (v1.0 - Web Application)
- ✅ **Web-based Video Editor** - Fully functional website accessible from any browser
- ✅ **Video Upload Interface** - Drag & drop or file selection for easy video uploads
- ✅ **Interactive Timeline Editor** - Visual timeline showing detected segments
- ✅ **Smart Segmentation** - AI-ready architecture for serve/score detection
- ✅ **Multi-Court Support** - Filter and view specific courts in multi-court recordings
- ✅ **Export Configuration** - Customizable quality, format, and content settings
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile browsers

### Planned Features
- 🔄 **AI Detection Backend** - Automatic serve, rally, and score detection using computer vision
- 🔄 **Player Tracking** - Identify and follow specific players throughout the match
- 🔄 **Highlight Reels** - Auto-generate personalized highlight videos
- 🔄 **Mobile Apps** - Native iOS and Android applications
- 🔄 **Desktop Apps** - Electron-based Windows, macOS, and Linux applications

## 🏗️ Architecture

### Frontend (Web)
- **Framework**: React 19.2 with Vite
- **Styling**: Modern CSS with responsive design
- **Components**: Modular component architecture
- **State Management**: React Hooks (useState)

### Backend (AI Service)
- **Framework**: FastAPI (Python)
- **Video Processing**: OpenCV, FFmpeg
- **AI Models**: YOLO for object detection, MediaPipe for pose estimation
- **API**: RESTful API with CORS support

### Cross-Platform Expansion (Planned)
- **Mobile**: React Native with Expo
- **Desktop**: Electron wrapper for desktop apps
- **Shared Codebase**: Maximum code reuse across platforms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- FFmpeg (for video processing)

### Installation

#### 1. Web Application

```bash
# Navigate to web app directory
cd BadmintonEditor/badminton-editor-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The web application will be available at `http://localhost:5173`

#### 2. Backend API (Optional for AI features)

```bash
# Navigate to backend directory
cd BadmintonEditor/backend

# Install Python dependencies
pip install -r requirements.txt

# Start API server
python main.py
```

The API will be available at `http://localhost:8000`  
API Documentation: `http://localhost:8000/docs`

### Building for Production

```bash
# Web application
cd badminton-editor-web
npm run build

# Preview production build
npm run preview
```

The production build will be in the `dist/` directory.

## 📱 Platform Support

### ✅ Web (Available Now)
The web application is fully functional and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (responsive design)
- Tablets

**Access**: Simply open in your browser, no installation required!

### 🔜 Mobile (Coming Soon)
Native mobile apps will be built using React Native:
- iOS (iPhone & iPad)
- Android (phones & tablets)

**Benefits**: 
- Native performance
- Offline support
- Camera integration for direct recording
- Push notifications for export completion

### 🔜 Desktop (Coming Soon)
Desktop applications will be built using Electron:
- Windows
- macOS
- Linux

**Benefits**:
- Standalone application
- Better performance for large videos
- Local file system access
- No browser limitations

## 🎯 Usage Guide

### 1. Upload Your Video
- Click "Upload" or drag & drop your badminton match video
- Supports: MP4, MOV, AVI, WebM formats
- Multi-court recordings are supported

### 2. Edit Timeline
- Review automatically detected segments (serves, rallies, scores)
- Filter by specific court if multiple courts detected
- Jump to any segment in the timeline
- Remove unwanted segments

### 3. Export
- Choose quality (High/Medium/Low)
- Select format (MP4/WebM/MOV)
- Configure content settings:
  - Include all segments or highlights only
  - Speed up idle segments
- Export and download your final video

## 🛠️ Development

### Project Structure

```
BadmintonEditor/
├── badminton-editor-web/          # React web application
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── VideoUploader.jsx  # Upload interface
│   │   │   ├── VideoTimeline.jsx  # Timeline editor
│   │   │   └── ExportPanel.jsx    # Export configuration
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # Entry point
│   ├── public/                    # Static assets
│   └── package.json               # Dependencies
│
├── backend/                       # Python AI service
│   ├── main.py                    # FastAPI server
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # Backend documentation
│
└── plan-badmintonEditor.prompt.md # Original requirements
```

### Technology Choices

#### Why React + Vite?
- Fast development with HMR (Hot Module Replacement)
- Modern build tooling
- Easy to extend to mobile (React Native) and desktop (Electron)
- Large ecosystem and community support

#### Why FastAPI?
- Modern Python framework with automatic API documentation
- Fast performance (async support)
- Easy integration with ML/AI libraries
- Type safety with Pydantic

#### Why OpenCV + YOLO?
- Industry-standard computer vision library
- Pre-trained models available for object detection
- Good performance for real-time processing
- Extensive documentation and community

### Adding New Features

1. **Frontend Components**: Add to `src/components/`
2. **Backend Endpoints**: Add to `backend/main.py`
3. **Styling**: Use component-specific CSS files
4. **State**: Use React hooks or add state management library

## 🔮 Roadmap

### Phase 1: MVP (✅ Complete)
- [x] Web application with video upload
- [x] Timeline editor UI
- [x] Export configuration
- [x] Responsive design
- [x] Backend API structure

### Phase 2: AI Integration (In Progress)
- [ ] Implement shuttlecock tracking
- [ ] Serve detection with pose estimation
- [ ] Court boundary identification
- [ ] Automatic score detection
- [ ] Multi-court recognition

### Phase 3: Enhanced Features
- [ ] Player tracking and identification
- [ ] Highlight reel generation
- [ ] Shot analysis (smashes, drops, clears)
- [ ] Statistics and analytics

### Phase 4: Cross-Platform
- [ ] React Native mobile apps (iOS/Android)
- [ ] Electron desktop apps (Windows/macOS/Linux)
- [ ] Cloud storage integration
- [ ] Social media sharing

## 📄 License

This project is part of the IdeaPlayground repository.

## 🤝 Contributing

Contributions are welcome! This is an open-source project for learning and experimentation.

## 🙏 Acknowledgments

- Built with React, Vite, and FastAPI
- Inspired by the need for better badminton video analysis tools
- Part of the IdeaPlayground project collection

---

**Made with ❤️ for badminton players and video enthusiasts**
