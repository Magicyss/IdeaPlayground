# 🏸 Quick Start Guide - Badminton Video Editor

Get up and running in 5 minutes!

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (optional, for AI features)
- **FFmpeg** (optional, for video processing)

## Step 1: Run the Web Application

```bash
# Navigate to the web app directory
cd BadmintonEditor/badminton-editor-web

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

✅ **Done!** Open http://localhost:5173 in your browser

## Step 2: Try It Out

1. **Upload a Video**
   - Click "Upload" or drag & drop a badminton match video
   - Supported formats: MP4, MOV, AVI, WebM

2. **Edit Timeline**
   - View automatically detected segments (demo data)
   - Click segments to jump to that moment
   - Filter by court if multiple courts detected
   - Remove unwanted segments

3. **Export**
   - Choose quality (High/Medium/Low)
   - Select format (MP4/WebM/MOV)
   - Configure content settings
   - Export your video

## Optional: Run the Backend API

For AI-powered video analysis:

```bash
# Navigate to backend directory
cd BadmintonEditor/backend

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Start the API server
python main.py
# OR use uvicorn directly:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Start the API server
python main.py
```

✅ API available at http://localhost:8000  
📚 API docs at http://localhost:8000/docs

## What You Get

### Web Application ✅
- Modern, responsive interface
- Video upload with drag & drop
- Interactive timeline editor
- Multi-court support
- Export with custom settings
- Works on desktop, tablet, and mobile browsers

### AI Backend (Ready for Integration) 🔜
- Video analysis API
- Segment detection endpoints
- Export processing
- Extensible for ML models

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [CROSS_PLATFORM_GUIDE.md](CROSS_PLATFORM_GUIDE.md) for mobile/desktop development
- Explore the backend [API documentation](backend/README.md)

## Troubleshooting

### npm install fails
- Make sure Node.js 18+ is installed: `node --version`
- Try deleting `node_modules` and `package-lock.json`, then reinstall

### Port 5173 already in use
- Stop any other Vite dev servers
- Or change the port in `vite.config.js`

### Video not playing
- Make sure your browser supports the video format
- Try converting to MP4 if other formats don't work

### Backend won't start
- Make sure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 8000 is available

## Production Build

To build for production:

```bash
cd badminton-editor-web
npm run build
```

Deploy the `dist/` folder to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

## Support

For issues or questions:
- Check the detailed [README.md](README.md)
- Review component code in `badminton-editor-web/src/components/`
- Examine API endpoints in `backend/main.py`

---

**Happy editing! 🎥🏸**
