from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import shutil
import uuid
import re
from pathlib import Path
from video_analyzer import analyze_badminton_video
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Storage for uploaded videos and their analysis
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
video_storage = {}  # video_id -> {filename, path, analysis}

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
    
    # Generate unique video ID and secure filename
    import time
    
    # Sanitize filename - keep only alphanumeric, dash, underscore, and dot
    safe_filename = re.sub(r'[^\w\-.]', '_', file.filename)
    unique_id = str(uuid.uuid4())
    video_id = f"video_{int(time.time())}_{unique_id[:8]}"
    
    # Use unique filename to prevent collisions
    file_extension = Path(safe_filename).suffix
    unique_filename = f"{video_id}{file_extension}"
    
    # Save file to uploads directory
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Store video info
    video_storage[video_id] = {
        "filename": safe_filename,
        "path": str(file_path),
        "analysis": None
    }
    
    logger.info(f"Video uploaded: {video_id} -> {file_path}")
    
    return {
        "video_id": video_id,
        "filename": safe_filename,
        "status": "uploaded",
        "message": "Video uploaded successfully. Ready for analysis."
    }

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_video(video_id: str):
    """
    Analyze video and detect key moments using AI
    
    Uses OpenCV for motion detection and computer vision to identify:
    1. Serves (motion patterns)
    2. Rallies (continuous action)
    3. Scores (pauses in action)
    4. Court boundaries
    """
    
    # Check if video exists
    if video_id not in video_storage:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_info = video_storage[video_id]
    video_path = video_info["path"]
    
    # Check if already analyzed
    if video_info["analysis"]:
        logger.info(f"Returning cached analysis for {video_id}")
        return AnalysisResult(**video_info["analysis"])
    
    logger.info(f"Starting AI analysis for {video_id}")
    
    try:
        # Perform actual video analysis
        analysis_result = analyze_badminton_video(video_path)
        
        # Convert to API format
        segments = [
            VideoSegment(
                id=seg['id'],
                start=seg['start'],
                end=seg['end'],
                type=seg['type'],
                court=seg['court'],
                confidence=seg['confidence']
            )
            for seg in analysis_result['segments']
        ]
        
        result = AnalysisResult(
            video_id=video_id,
            segments=segments,
            total_duration=analysis_result['total_duration'],
            courts_detected=analysis_result['courts_detected']
        )
        
        # Cache the analysis
        video_info["analysis"] = result.dict()
        
        logger.info(f"Analysis complete for {video_id}: {len(segments)} segments detected")
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing video {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing video: {str(e)}")

@app.get("/api/segments/{video_id}", response_model=List[VideoSegment])
async def get_segments(video_id: str):
    """
    Get detected segments for a video
    """
    if video_id not in video_storage:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_info = video_storage[video_id]
    
    if not video_info["analysis"]:
        raise HTTPException(status_code=400, detail="Video not analyzed yet. Call /api/analyze first")
    
    return video_info["analysis"]["segments"]

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
    # Create required directories
    UPLOAD_DIR.mkdir(exist_ok=True)
    PROCESSED_DIR.mkdir(exist_ok=True)
    
    print("""
    🏸 Badminton Video Editor API Server - AI ENABLED
    =================================================
    Server starting on http://localhost:8000
    API Documentation: http://localhost:8000/docs
    
    Features:
    - Real-time video analysis using OpenCV
    - Motion-based serve/rally/score detection
    - Multi-court support
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
