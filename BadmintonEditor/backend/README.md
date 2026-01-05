# Badminton Video Editor - Backend AI Service

This is the Python backend service for AI-powered video analysis of badminton matches.

## Features

- Video processing and analysis
- Shuttlecock tracking using computer vision
- Serve detection using pose estimation
- Court boundary identification
- Score detection
- Multi-court support

## Technology Stack

- **FastAPI** - Modern Python web framework
- **OpenCV** - Video processing
- **YOLO/MediaPipe** - Object detection and pose estimation
- **FFmpeg** - Video encoding/decoding

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

```bash
python main.py
```

The API will be available at `http://localhost:8000`

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
