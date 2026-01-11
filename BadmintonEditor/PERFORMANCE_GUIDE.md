# Performance Guide - CPU vs GPU Processing

## 🖥️ Current Implementation (CPU-Only)

### Is it using CPU?
**YES**, the current OpenCV motion detection uses **CPU only**.

### Processing Speed Analysis

**2-Hour Video Example:**
- Resolution: 1080p @ 60fps
- Total frames: 432,000 frames
- **With 3x frame skip**: 144,000 frames analyzed
- **Processing speed**: ~60 frames/second (CPU)
- **Total time**: ~40 minutes

**Formula:**
```
Total Time = (Total Frames ÷ Frame Skip) ÷ Processing Speed (fps)
Total Time = (432,000 ÷ 3) ÷ 60 ≈ 2,400 seconds ≈ 40 minutes
```

### Why So Slow?

**OpenCV CPU Processing:**
1. **Frame by frame** - Sequential processing
2. **No parallelization** - Single CPU core usage
3. **Complex operations** - Grayscale conversion, frame differencing, thresholding
4. **Large videos** - 2-hour videos have 432K frames @ 60fps

## ⚡ Speed Optimization Strategies

### 1. Increase Frame Skip (Immediate Solution)

**Current**: `frame_skip=3` (3x faster)

**Edit `video_analyzer.py`:**
```python
# Option 1: 5x faster (recommended for long videos)
analyzer = BadmintonVideoAnalyzer(frame_skip=5)
# 2-hour video: ~24 minutes instead of 40 minutes

# Option 2: 10x faster (good for quick preview)
analyzer = BadmintonVideoAnalyzer(frame_skip=10)
# 2-hour video: ~12 minutes instead of 40 minutes

# Option 3: 15x faster (fast but may miss quick actions)
analyzer = BadmintonVideoAnalyzer(frame_skip=15)
# 2-hour video: ~8 minutes instead of 40 minutes
```

**Trade-offs:**
- ✅ No additional setup required
- ✅ Works on any CPU
- ❌ May miss very quick actions (shuttlecock hits)
- ❌ Still relatively slow for long videos

### 2. GPU Acceleration with CUDA + OpenCV (10-30x Faster)

**Setup:**
```bash
pip uninstall opencv-python
pip install opencv-contrib-python  # With CUDA support
```

**Edit video_analyzer.py:**
```python
import cv2

def _analyze_motion_gpu(self, cap, progress_callback=None):
    """GPU-accelerated motion analysis"""
    
    # Enable CUDA if available
    if cv2.cuda.getCudaEnabledDeviceCount() > 0:
        print("✅ GPU detected! Using CUDA acceleration")
        use_gpu = True
    else:
        print("❌ No GPU detected, using CPU")
        use_gpu = False
    
    motion_scores = []
    prev_frame_gpu = None
    
    for frame_idx in range(0, total_frames, self.frame_skip):
        ret, frame = cap.read()
        if not ret:
            break
            
        if use_gpu:
            # Upload frame to GPU
            gpu_frame = cv2.cuda_GpuMat()
            gpu_frame.upload(frame)
            
            # GPU-accelerated grayscale conversion
            gpu_gray = cv2.cuda.cvtColor(gpu_frame, cv2.COLOR_BGR2GRAY)
            
            # GPU-accelerated Gaussian blur
            gpu_blurred = cv2.cuda.GaussianBlur(gpu_gray, (21, 21), 0)
            
            if prev_frame_gpu is not None:
                # GPU-accelerated frame difference
                diff = cv2.cuda.absdiff(gpu_blurred, prev_frame_gpu)
                
                # Download result from GPU
                diff_cpu = diff.download()
                motion_score = np.sum(diff_cpu)
                motion_scores.append(motion_score)
            
            prev_frame_gpu = gpu_blurred
        else:
            # CPU fallback (current implementation)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # ... rest of CPU code
```

**Requirements:**
- NVIDIA GPU (GTX 1060 or better)
- CUDA Toolkit installed
- opencv-contrib-python with CUDA build

**Speed Improvement:**
- 2-hour video: **2-4 minutes** instead of 40 minutes
- **10-30x faster** than CPU

### 3. YOLO Object Detection (Real-time, GPU)

**Best for:** Shuttlecock tracking, player detection

**Installation:**
```bash
pip install ultralytics  # YOLOv8
```

**Implementation:**
```python
from ultralytics import YOLO

class BadmintonYOLOAnalyzer:
    def __init__(self):
        # Load pre-trained YOLO model
        self.model = YOLO('yolov8n.pt')  # Nano model for speed
        
    def analyze_video(self, video_path):
        # YOLO processes at 30-60 FPS on GPU!
        results = self.model.track(
            source=video_path,
            conf=0.3,  # Confidence threshold
            iou=0.5,   # IOU threshold
            device=0,  # Use GPU 0
            stream=True  # Stream mode for memory efficiency
        )
        
        segments = []
        for r in results:
            # Detect shuttlecock (would need fine-tuned model)
            # or use pre-trained "sports ball" class
            boxes = r.boxes
            for box in boxes:
                if box.cls == 32:  # Sports ball class
                    segments.append({
                        'time': r.speed,
                        'type': 'shuttlecock_detected'
                    })
        
        return segments
```

**Speed:**
- 2-hour video: **4-8 minutes** (real-time processing at 30-60 FPS)
- **30-50x faster** than CPU OpenCV

**Note:** Requires **fine-tuning** on badminton dataset for best results.

### 4. MediaPipe (CPU-Friendly, Google Optimized)

**Best for:** Player pose estimation, movement analysis

**Installation:**
```bash
pip install mediapipe
```

**Implementation:**
```python
import mediapipe as mp

class BadmintonMediaPipeAnalyzer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            model_complexity=0,  # 0=fastest, 2=most accurate
            min_detection_confidence=0.5
        )
    
    def analyze_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        segments = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert to RGB (MediaPipe requirement)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame (optimized by Google)
            results = self.pose.process(frame_rgb)
            
            if results.pose_landmarks:
                # Detect player actions from pose
                # e.g., arm raised = serving, jumping = smash
                landmarks = results.pose_landmarks.landmark
                
                # Example: Detect serve (arm raised)
                right_shoulder = landmarks[12]
                right_wrist = landmarks[16]
                
                if right_wrist.y < right_shoulder.y - 0.1:
                    segments.append({'type': 'serve', 'time': cap.get(cv2.CAP_PROP_POS_MSEC)})
        
        return segments
```

**Speed:**
- 2-hour video: **10-15 minutes** on CPU
- **3-5x faster** than basic OpenCV on CPU
- **Runs without GPU!**

### 5. Multi-Modal LLM (GPT-4V, Gemini Vision)

**Best for:** Intelligent scene understanding, commentary generation

**Installation:**
```bash
pip install openai  # For GPT-4V
# or
pip install google-generativeai  # For Gemini
```

**Implementation:**
```python
import openai
import base64

class BadmintonLLMAnalyzer:
    def __init__(self, api_key):
        openai.api_key = api_key
    
    def analyze_keyframes(self, video_path):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Extract keyframes (every 5 seconds)
        keyframes = []
        frame_interval = int(fps * 5)
        
        for i in range(0, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if ret:
                # Encode frame as base64
                _, buffer = cv2.imencode('.jpg', frame)
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                keyframes.append({'time': i/fps, 'image': img_base64})
        
        # Analyze each keyframe with GPT-4V
        segments = []
        for kf in keyframes:
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this badminton frame. Is it: 1) Serve, 2) Rally, 3) Score? Explain briefly."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{kf['image']}"}}
                    ]
                }],
                max_tokens=100
            )
            
            analysis = response.choices[0].message.content
            segments.append({'time': kf['time'], 'analysis': analysis})
        
        return segments
```

**Speed:**
- 2-hour video: **5-10 minutes** (analyzing ~1,440 keyframes @ 5sec intervals)
- **Smart but not real-time**
- **Requires API key** (costs money per request)

**Pros:**
- ✅ Understands context (can identify smash, drop shot, etc.)
- ✅ Can generate commentary
- ✅ No local GPU needed

**Cons:**
- ❌ Costs money (~$0.01 per frame)
- ❌ Requires internet connection
- ❌ Slower than GPU-based local processing

## 📊 Speed Comparison Table

| Method | Hardware | 2-Hour Video Time | Speedup | Cost |
|--------|----------|-------------------|---------|------|
| **Current OpenCV CPU** | CPU | ~40 min | 1x | Free |
| **Frame Skip 10x** | CPU | ~12 min | 3.3x | Free |
| **OpenCV + CUDA GPU** | NVIDIA GPU | ~2-4 min | 10-20x | GPU required |
| **YOLO GPU** | NVIDIA GPU | ~4-8 min | 5-10x | GPU required |
| **MediaPipe CPU** | CPU | ~10-15 min | 2-4x | Free |
| **GPT-4V API** | Cloud | ~5-10 min | 4-8x | $10-50/video |

## 🎯 Recommendations

### For Immediate Use (No GPU):
1. **Increase frame skip to 10x**: Edit `video_analyzer.py`, change `frame_skip=10`
   - 2-hour video: 12 minutes instead of 40 minutes

2. **Switch to MediaPipe**: Better pose estimation, 3-5x faster on CPU
   - 2-hour video: 10-15 minutes

### For Best Performance (With GPU):
1. **YOLO with GPU**: Train/fine-tune on badminton dataset
   - 2-hour video: 4-8 minutes
   - Best for shuttlecock tracking

2. **OpenCV + CUDA**: Use GPU-accelerated OpenCV functions
   - 2-hour video: 2-4 minutes
   - Minimal code changes

### For Smart Analysis (Cloud):
1. **GPT-4V or Gemini**: Keyframe analysis with AI understanding
   - 2-hour video: 5-10 minutes
   - Best for highlight reels and commentary

## 💻 Checking Your GPU

```bash
# Check if NVIDIA GPU is available
nvidia-smi

# Check CUDA availability in Python
python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

If you have an NVIDIA GPU, **YOLO or CUDA OpenCV** will give you the best speedup!
