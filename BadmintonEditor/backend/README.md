# Badminton Video Editor Backend - Flask Edition

## 🎯 Windows-Compatible AI-Powered Backend

Flask-based backend with OpenCV motion detection for badminton video analysis.

### ✨ New Features (v3.0)

- ✅ **20GB file upload limit** (increased from 500MB)
- ✅ **Real-time progress tracking** - See frame processing status
- ✅ **3x faster analysis** - Frame skipping optimization (every 3rd frame)
- ✅ **Progress API** - `/api/progress/<video_id>` endpoint
- ✅ **Windows compatible** - Single-process Flask design
- ✅ **Ctrl+C works** - Proper process termination

### 🚀 Quick Start

```bash
cd BadmintonEditor/backend

# Install dependencies
pip install -r requirements.txt

# Verify OpenCV
python -c "import cv2; print('OpenCV:', cv2.__version__)"

# Start server
python main.py
```

Server starts at: **http://localhost:8000**

### 📊 Performance with Frame Skipping

**Current: Process every 3rd frame (3x faster)**

| Video Length | Total Frames | Analyzed Frames | Processing Time |
|--------------|-------------|-----------------|-----------------|
| 10 minutes   | 18,000      | 6,000          | ~2-3 minutes    |
| 30 minutes   | 54,000      | 18,000         | ~6-9 minutes    |
| 1 hour       | 108,000     | 36,000         | ~12-18 minutes  |

### 🚀 Future AI Alternatives (For Faster Processing)

**Option 1: YOLO - Real-time Object Detection**
- Speed: 30-60 FPS (10-30x faster)
- Use: Shuttlecock tracking, player detection
- Requires: GPU (CUDA)

**Option 2: MediaPipe - CPU-Friendly Pose Estimation**
- Speed: Real-time on CPU
- Use: Player movement tracking
- Requires: CPU only

**Option 3: Multi-Modal LLMs (GPT-4V, Gemini Vision)**
- Speed: Slower but intelligent
- Use: Highlight generation, game commentary
- Requires: API key, internet

See full documentation in README for implementation examples.

### 📝 Quick Configuration

**Adjust processing speed:**
```python
# In main.py, modify analyze call:
analyze_badminton_video(video_path, frame_skip=5)  # 5x faster
```

**Increase upload limit:**
```python
# In main.py:
MAX_CONTENT_LENGTH = 20 * 1024 * 1024 * 1024  # 20GB
```

### 📚 Full Documentation

See complete API documentation, troubleshooting, and AI alternatives in the full README above.
