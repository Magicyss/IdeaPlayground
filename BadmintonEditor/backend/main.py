"""
Flask-based Backend for Badminton Video Editor
Alternative implementation for Windows compatibility
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
import re
import time
import logging
from pathlib import Path

# Setup logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try GPU-accelerated analyzer first, fall back to CPU
try:
    from video_analyzer_gpu import analyze_badminton_video_gpu
    USE_GPU = os.environ.get('GPU_ENABLED', 'true').lower() == 'true'
    logger.info(f"GPU module loaded. GPU_ENABLED={USE_GPU}")
except ImportError:
    logger.warning("GPU module not available, using CPU-only analyzer")
    USE_GPU = False

from video_analyzer import analyze_badminton_video

app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configuration
UPLOAD_FOLDER = Path('uploads')
PROCESSED_FOLDER = Path('processed')
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'webm'}
MAX_CONTENT_LENGTH = 20 * 1024 * 1024 * 1024  # 20GB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Storage for uploaded videos and their analysis
video_storage = {}  # video_id -> {filename, path, analysis, progress, upload_progress}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def sanitize_filename(filename):
    """Sanitize filename to prevent security issues"""
    # Keep only alphanumeric, dash, underscore, and dot
    safe_name = re.sub(r'[^\w\-.]', '_', filename)
    return secure_filename(safe_name)


@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        "message": "Badminton Video Editor API - Flask Edition",
        "status": "running",
        "version": "2.0.0",
        "framework": "Flask"
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    local_mode_enabled = os.environ.get('LOCAL_MODE', 'false').lower() == 'true'
    gpu_enabled = os.environ.get('GPU_ENABLED', 'false').lower() == 'true'
    
    return jsonify({
        "status": "healthy",
        "local_mode": local_mode_enabled,
        "gpu_enabled": gpu_enabled and USE_GPU,
        "framework": "Flask"
    })


@app.route('/api/routes', methods=['GET'])
def list_routes():
    """List all available API routes (debug endpoint)"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            "endpoint": rule.endpoint,
            "methods": list(rule.methods),
            "path": str(rule)
        })
    return jsonify({"routes": routes})


@app.route('/api/upload', methods=['POST'])
def upload_video():
    """
    Upload a video file for processing
    """
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    
    file = request.files['file']
    
    # Check if file is selected
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Validate file type
    if not allowed_file(file.filename):
        return jsonify({
            "error": "Invalid file type. Allowed: MP4, MOV, AVI, WebM"
        }), 400
    
    try:
        # Generate unique video ID and secure filename
        safe_filename = sanitize_filename(file.filename)
        unique_id = str(uuid.uuid4())
        video_id = f"video_{int(time.time())}_{unique_id[:8]}"
        
        # Use unique filename to prevent collisions
        file_extension = Path(safe_filename).suffix
        unique_filename = f"{video_id}{file_extension}"
        
        # Save file to uploads directory
        file_path = UPLOAD_FOLDER / unique_filename
        file.save(str(file_path))
        
        # Store video info
        video_storage[video_id] = {
            "filename": safe_filename,
            "path": str(file_path),
            "analysis": None,
            "progress": 0
        }
        
        logger.info(f"Video uploaded: {video_id} -> {file_path}")
        
        return jsonify({
            "video_id": video_id,
            "filename": safe_filename,
            "status": "uploaded",
            "message": "Video uploaded successfully. Ready for analysis."
        }), 200
    
    except Exception as e:
        logger.error(f"Error uploading video: {str(e)}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """
    Analyze video and detect key moments using AI
    
    Uses OpenCV for motion detection and computer vision to identify:
    1. Serves (motion patterns)
    2. Rallies (continuous action)
    3. Scores (pauses in action)
    4. Court boundaries
    """
    data = request.get_json()
    
    if not data or 'video_id' not in data:
        return jsonify({"error": "video_id is required"}), 400
    
    video_id = data['video_id']
    
    # Check if video exists
    if video_id not in video_storage:
        return jsonify({"error": "Video not found"}), 404
    
    video_info = video_storage[video_id]
    video_path = video_info["path"]
    
    # Check if already analyzed
    if video_info["analysis"]:
        logger.info(f"Returning cached analysis for {video_id}")
        return jsonify(video_info["analysis"]), 200
    
    logger.info(f"Starting AI analysis for {video_id}")
    
    try:
        # Progress callback to update status
        def progress_callback(current, total):
            if total > 0:
                progress = int((current / total) * 100)
                video_info["progress"] = progress
                logger.info(f"Analysis progress for {video_id}: {progress}% ({current}/{total} frames)")
        
        # Use GPU-accelerated analyzer if available
        if USE_GPU:
            try:
                logger.info(f"🚀 Using GPU-accelerated analyzer for {video_id}")
                analysis_result = analyze_badminton_video_gpu(
                    video_path, 
                    progress_callback=progress_callback,
                    use_gpu=True
                )
            except Exception as gpu_error:
                logger.warning(f"GPU analysis failed, falling back to CPU: {gpu_error}")
                analysis_result = analyze_badminton_video(video_path, progress_callback=progress_callback)
        else:
            logger.info(f"Using CPU analyzer for {video_id}")
            analysis_result = analyze_badminton_video(video_path, progress_callback=progress_callback)
        
        # Format response
        result = {
            "video_id": video_id,
            "segments": analysis_result['segments'],
            "total_duration": analysis_result['total_duration'],
            "courts_detected": analysis_result['courts_detected'],
            "total_frames": analysis_result.get('total_frames', 0),
            "fps": analysis_result.get('fps', 0),
            "gpu_accelerated": analysis_result.get('gpu_accelerated', False)
        }
        
        # Cache the analysis
        video_info["analysis"] = result
        video_info["progress"] = 100
        
        mode = "GPU" if result.get('gpu_accelerated') else "CPU"
        logger.info(f"✅ Analysis complete for {video_id} ({mode}): {len(result['segments'])} segments detected")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error analyzing video {video_id}: {str(e)}")
        return jsonify({"error": f"Error analyzing video: {str(e)}"}), 500


@app.route('/api/segments/<video_id>', methods=['GET'])
def get_segments(video_id):
    """
    Get detected segments for a video
    """
    if video_id not in video_storage:
        return jsonify({"error": "Video not found"}), 404
    
    video_info = video_storage[video_id]
    
    if not video_info["analysis"]:
        return jsonify({
            "error": "Video not analyzed yet. Call /api/analyze first"
        }), 400
    
    return jsonify(video_info["analysis"]["segments"]), 200


@app.route('/api/progress/<video_id>', methods=['GET'])
def get_progress(video_id):
    """
    Get analysis progress for a video
    """
    if video_id not in video_storage:
        return jsonify({"error": "Video not found"}), 404
    
    progress = video_storage[video_id].get("progress", 0)
    return jsonify({"video_id": video_id, "progress": progress}), 200


@app.route('/api/analyze-local', methods=['POST', 'OPTIONS'])
def analyze_local_video():
    """
    Analyze a video from local file path (development mode only)
    Skips upload step - directly analyzes file from filesystem
    
    Requires LOCAL_MODE=true environment variable
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        logger.info("OPTIONS request received for /api/analyze-local")
        return jsonify({"status": "ok"}), 200
    
    logger.info(f"POST request received for /api/analyze-local")
    
    # Check if local mode is enabled
    local_mode = os.environ.get('LOCAL_MODE', 'false').lower() == 'true'
    logger.info(f"LOCAL_MODE environment variable: {os.environ.get('LOCAL_MODE', 'not set')}")
    logger.info(f"Local mode enabled: {local_mode}")
    
    if not local_mode:
        return jsonify({
            "error": "Local mode not enabled. Set LOCAL_MODE=true environment variable."
        }), 403
    
    data = request.get_json()
    if not data or 'video_path' not in data:
        logger.error("No video_path in request data")
        return jsonify({"error": "No video_path provided"}), 400
    
    video_path = data['video_path']
    logger.info(f"Analyzing local video: {video_path}")
    
    try:
        # Validate and sanitize path
        file_path = Path(video_path)
        
        # Security check: file must exist and be a file
        if not file_path.exists():
            return jsonify({"error": f"File not found: {video_path}"}), 404
        
        if not file_path.is_file():
            return jsonify({"error": "Path is not a file"}), 400
        
        # Check file extension
        if file_path.suffix.lower() not in ['.mp4', '.mov', '.avi', '.webm']:
            return jsonify({
                "error": "Invalid file type. Allowed: MP4, MOV, AVI, WebM"
            }), 400
        
        # Generate unique video ID
        unique_id = str(uuid.uuid4())
        video_id = f"local_{int(time.time())}_{unique_id[:8]}"
        
        # Store video info (path only, no upload)
        video_storage[video_id] = {
            "filename": file_path.name,
            "path": str(file_path),
            "analysis": None,
            "progress": 0,
            "local_mode": True
        }
        
        logger.info(f"Local video registered: {video_id} -> {file_path}")
        
        # Immediately analyze the video
        video_info = video_storage[video_id]
        video_file_path = Path(video_info["path"])
        
        # Progress callback
        def update_progress(progress):
            video_info["progress"] = progress
        
        # Run analysis
        if USE_GPU:
            logger.info(f"Analyzing {video_id} with GPU acceleration (local mode)")
            analysis_result = analyze_badminton_video_gpu(
                str(video_file_path),
                progress_callback=update_progress
            )
        else:
            logger.info(f"Analyzing {video_id} with CPU (local mode)")
            analysis_result = analyze_badminton_video(
                str(video_file_path),
                progress_callback=update_progress
            )
        
        result = {
            "video_id": video_id,
            "filename": video_info["filename"],
            "segments": analysis_result['segments'],
            "total_duration": analysis_result['total_duration'],
            "courts_detected": analysis_result['courts_detected'],
            "total_frames": analysis_result.get('total_frames', 0),
            "fps": analysis_result.get('fps', 0),
            "gpu_accelerated": analysis_result.get('gpu_accelerated', False),
            "local_mode": True
        }
        
        # Cache the analysis
        video_info["analysis"] = result
        video_info["progress"] = 100
        
        mode = "GPU" if result.get('gpu_accelerated') else "CPU"
        logger.info(f"✅ Local analysis complete for {video_id} ({mode}): {len(result['segments'])} segments")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error analyzing local video: {str(e)}")
        return jsonify({"error": f"Error analyzing local video: {str(e)}"}), 500


@app.route('/api/export', methods=['POST'])
def export_video():
    """
    Export processed video with selected segments
    
    This would use FFmpeg to:
    1. Extract selected segments
    2. Apply speed changes if requested
    3. Concatenate segments
    4. Encode with specified quality and format
    5. Return download URL
    """
    data = request.get_json()
    
    if not data or 'video_id' not in data:
        return jsonify({"error": "video_id is required"}), 400
    
    video_id = data['video_id']
    segments = data.get('segments', [])
    quality = data.get('quality', 'high')
    format_type = data.get('format', 'mp4')
    
    return jsonify({
        "status": "processing",
        "video_id": video_id,
        "segments_count": len(segments),
        "quality": quality,
        "format": format_type,
        "estimated_time": "30 seconds",
        "message": "Export started. Video will be ready shortly."
    }), 200


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        "error": "File too large. Maximum size is 20GB"
    }), 413


@app.errorhandler(500)
def internal_server_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "error": "Internal server error",
        "message": str(error)
    }), 500


if __name__ == '__main__':
    # Create required directories
    UPLOAD_FOLDER.mkdir(exist_ok=True)
    PROCESSED_FOLDER.mkdir(exist_ok=True)
    
    print("""
    🏸 Badminton Video Editor API Server - Flask Edition - AI ENABLED
    ==================================================================
    Server starting on http://localhost:8000
    
    Features:
    - Real-time video analysis using OpenCV
    - Motion-based serve/rally/score detection
    - Multi-court support
    - Windows-compatible Flask backend
    
    Press Ctrl+C to stop the server
    """)
    
    # Run Flask server
    # Note: debug=False and use_reloader=False for Windows compatibility
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=False,
        use_reloader=False,
        threaded=True
    )
