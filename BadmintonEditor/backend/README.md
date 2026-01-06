# Badminton Video Editor - Backend AI Service

This is the Python backend service for AI-powered video analysis of badminton matches.

## Features

- ✅ **Real-time Video Analysis** - Processes videos using OpenCV
- ✅ **Motion Detection** - Identifies movement patterns for serves and rallies
- ✅ **Scene Segmentation** - Automatically detects pauses and transitions
- ✅ **Multi-Court Detection** - Estimates number of courts in recording
- ✅ **Confidence Scoring** - Provides reliability scores for each detection
- 🔄 **Shuttlecock Tracking** (Coming Soon) - YOLO-based object detection
- 🔄 **Pose Estimation** (Coming Soon) - MediaPipe for player tracking

## Technology Stack

- **FastAPI** - Modern Python web framework
- **OpenCV** - Computer vision and video processing
- **NumPy** - Numerical computations
- **FFmpeg** - Video encoding/decoding (future)
- **YOLO/MediaPipe** - Advanced AI models (planned)

## How It Works

### Motion Detection Algorithm

1. **Frame Analysis**: Each video frame is converted to grayscale and analyzed
2. **Motion Scoring**: Frame differences are calculated to detect movement
3. **Pattern Recognition**: High motion = rallies, Low motion = serves/scores
4. **Segmentation**: Continuous motion patterns are grouped into segments
5. **Classification**: Segments are classified based on duration and motion intensity

### Detection Types

- **Serve**: Short low-motion periods (preparation phase)
- **Rally**: Extended high-motion periods (active play)
- **Score**: Low-motion after rally (point scored, reset)

## Setup

### Prerequisites

- Python 3.8+
- pip
- FFmpeg

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Running the Server

**Method 1: Using the main.py script (recommended)**
```bash
python main.py
```

**Method 2: Using uvicorn directly**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive API documentation: `http://localhost:8000/docs`

## API Endpoints

### POST /api/upload
Upload a video file for processing

### POST /api/analyze
Analyze video and detect key moments

### GET /api/segments/{video_id}
Get detected segments for a video

### POST /api/export
Export processed video with selected segments

## Future Enhancements

- Player tracking and identification
- Highlight reel generation
- Real-time processing
- Cloud deployment support
