# Badminton Video Editor Backend - Flask Edition

## Windows-Compatible Backend

This is a Flask-based backend alternative designed for better Windows compatibility.

### Why Flask?

If you're experiencing issues with FastAPI/uvicorn on Windows, Flask is a more stable alternative:
- Single-threaded by default (easier process management)
- Better Windows compatibility
- Simpler to start and stop (Ctrl+C works properly)
- Same AI functionality as FastAPI version

### Installation

```bash
cd BadmintonEditor/backend

# Uninstall previous packages (if any)
pip uninstall fastapi uvicorn opencv-python opencv-python-headless numpy -y

# Install Flask version
pip install -r requirements_flask.txt

# Verify OpenCV installation
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
```

### Running the Server

**Option 1: Using Flask directly (Recommended for Windows)**
```bash
python main_flask.py
```

**Option 2: Using Flask CLI**
```bash
set FLASK_APP=main_flask.py
flask run --host=0.0.0.0 --port=8000
```

The server will start at: http://localhost:8000

### Stopping the Server

Simply press `Ctrl+C` in the terminal. Flask handles this gracefully on Windows.

### API Endpoints

Same endpoints as FastAPI version:

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/upload` - Upload video file
- `POST /api/analyze` - Analyze video with AI
- `GET /api/segments/<video_id>` - Get detected segments
- `POST /api/export` - Export processed video

### Testing the Backend

1. **Start the backend:**
   ```bash
   python main_flask.py
   ```

2. **Open browser and test:**
   - Health check: http://localhost:8000/health
   - API info: http://localhost:8000

3. **Start the frontend (in another terminal):**
   ```bash
   cd ../badminton-editor-web
   npm run dev
   ```

4. **Access the app:**
   - Open http://localhost:5173

### Features

- ✅ Real AI video analysis with OpenCV
- ✅ Motion detection for serves/rallies/scores
- ✅ Multi-court support
- ✅ Windows-compatible
- ✅ Proper Ctrl+C handling
- ✅ File upload with security checks
- ✅ Video segmentation
- ✅ Export functionality

### Troubleshooting

**Server won't start:**
```bash
# Check if port 8000 is available
netstat -ano | findstr :8000

# If occupied, kill the process or use a different port
# Edit main_flask.py and change port=8000 to port=8001
```

**OpenCV import error:**
```bash
# Reinstall OpenCV and NumPy
pip uninstall opencv-python numpy -y
pip install numpy==1.24.3 opencv-python==4.8.1.78
```

**Can't stop server:**
- Press Ctrl+C
- If that doesn't work, close the terminal window
- Or use Task Manager to end Python process

### Comparison: FastAPI vs Flask

| Feature | FastAPI | Flask |
|---------|---------|-------|
| Speed | Faster | Good |
| Windows Compatibility | Issues with reload | ✅ Excellent |
| Async Support | Native | Requires extension |
| Process Management | Complex (multiprocess) | Simple |
| Auto Documentation | ✅ Built-in | Requires extension |
| **Recommendation** | Linux/Mac | ✅ **Windows** |

### Technical Details

- **Framework:** Flask 3.0.0
- **CORS:** Enabled for localhost:5173
- **Max File Size:** 500MB
- **Supported Formats:** MP4, MOV, AVI, WebM
- **OpenCV Version:** 4.8.1.78
- **NumPy Version:** <2.0.0 (for compatibility)

### Security

- Filename sanitization
- File type validation
- Secure file storage
- UUID-based file naming
- Path traversal prevention

### Next Steps

Once the Flask backend is working, you can:
1. Keep using Flask backend permanently
2. Or switch back to FastAPI on a different system (Linux/Mac)
3. Both backends have identical functionality

The frontend works seamlessly with both backends!
