from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os

app = FastAPI(
    title="Badminton Video Editor API",
    description="AI-powered video analysis for badminton matches",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class VideoSegment(BaseModel):
    id: int
    start: float
    end: float
    type: str  # serve, rally, score
    court: int
    confidence: float = 0.0

class AnalysisResult(BaseModel):
    video_id: str
    segments: List[VideoSegment]
    total_duration: float
    courts_detected: int

class ExportRequest(BaseModel):
    video_id: str
    segments: List[VideoSegment]
    quality: str = "high"
    format: str = "mp4"

# API endpoints
@app.get("/")
async def root():
    return {
        "message": "Badminton Video Editor API",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for processing
    """
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # In production, save to storage and return video_id
    video_id = f"video_{len(file.filename)}"
    
    return {
        "video_id": video_id,
        "filename": file.filename,
        "status": "uploaded",
        "message": "Video uploaded successfully. Ready for analysis."
    }

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_video(video_id: str):
    """
    Analyze video and detect key moments using AI
    
    This is a placeholder implementation. In production, this would:
    1. Load the video using OpenCV
    2. Use YOLO for shuttlecock detection
    3. Use MediaPipe for pose estimation (serve detection)
    4. Detect court boundaries
    5. Identify score moments
    6. Return timestamped segments
    """
    
    # Mock AI analysis results
    mock_segments = [
        VideoSegment(id=1, start=0.0, end=15.5, type="serve", court=1, confidence=0.95),
        VideoSegment(id=2, start=15.5, end=45.2, type="rally", court=1, confidence=0.89),
        VideoSegment(id=3, start=45.2, end=47.0, type="score", court=1, confidence=0.92),
        VideoSegment(id=4, start=47.0, end=62.5, type="serve", court=2, confidence=0.87),
        VideoSegment(id=5, start=62.5, end=95.0, type="rally", court=2, confidence=0.88),
        VideoSegment(id=6, start=95.0, end=97.5, type="score", court=2, confidence=0.91),
    ]
    
    return AnalysisResult(
        video_id=video_id,
        segments=mock_segments,
        total_duration=120.0,
        courts_detected=2
    )

@app.get("/api/segments/{video_id}", response_model=List[VideoSegment])
async def get_segments(video_id: str):
    """
    Get detected segments for a video
    """
    # In production, retrieve from database
    mock_segments = [
        VideoSegment(id=1, start=0.0, end=15.5, type="serve", court=1, confidence=0.95),
        VideoSegment(id=2, start=15.5, end=45.2, type="rally", court=1, confidence=0.89),
    ]
    return mock_segments

@app.post("/api/export")
async def export_video(request: ExportRequest):
    """
    Export processed video with selected segments
    
    This would use FFmpeg to:
    1. Extract selected segments
    2. Apply speed changes if requested
    3. Concatenate segments
    4. Encode with specified quality and format
    5. Return download URL
    """
    
    return {
        "status": "processing",
        "video_id": request.video_id,
        "segments_count": len(request.segments),
        "quality": request.quality,
        "format": request.format,
        "estimated_time": "30 seconds",
        "message": "Export started. Video will be ready shortly."
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("processed", exist_ok=True)
    
    print("""
    🏸 Badminton Video Editor API Server
    ====================================
    Server starting on http://localhost:8000
    API Documentation: http://localhost:8000/docs
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
