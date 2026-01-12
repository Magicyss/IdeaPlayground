import { useState } from 'react'
import './VideoUploader.css'

function VideoUploader({ onVideoUpload, onLocalPath }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [localPath, setLocalPath] = useState('')
  
  // Check if local mode is enabled
  const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true'

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    // Validate file type
    const videoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!videoTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, MOV, AVI, WebM)')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (selectedFile) {
      onVideoUpload(selectedFile)
    }
  }
  
  const handleLocalAnalyze = () => {
    if (localPath.trim()) {
      onLocalPath(localPath)
    } else {
      alert('Please enter a valid file path')
    }
  }

  return (
    <div className="video-uploader">
      <div className="upload-card">
        <h2>Upload Your Badminton Match Video</h2>
        <p className="upload-description">
          上传您的羽毛球比赛视频，AI将自动分析并检测发球、得分等关键时刻。
        </p>
        <p className="upload-description" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Upload your badminton match video. AI will automatically analyze and detect serves, scores, and key moments using OpenCV.
        </p>
        
        {isLocalMode && (
          <div className="local-mode-banner">
            <span className="local-mode-icon">🔧</span>
            <strong>Local Development Mode</strong> - Enter file path instead of uploading
          </div>
        )}

        {isLocalMode ? (
          // Local mode: File path input
          <div className="local-path-input-container">
            <label htmlFor="local-path" className="local-path-label">
              Enter Local Video File Path:
            </label>
            <input
              type="text"
              id="local-path"
              className="local-path-input"
              placeholder="C:\Videos\badminton\match.mp4"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
            />
            <p className="local-path-hint">
              Example: <code>C:\Videos\match.mp4</code> or <code>/home/user/videos/match.mp4</code>
            </p>
            <button 
              className="upload-btn" 
              onClick={handleLocalAnalyze}
              disabled={!localPath.trim()}
            >
              Analyze Local File
            </button>
          </div>
        ) : (
          // Upload mode: Drag & drop interface
          <>
            <div
              className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'file-selected' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="video-input"
                className="file-input"
                accept="video/*"
                onChange={handleChange}
              />
              
              {!selectedFile ? (
                <>
                  <div className="upload-icon">📹</div>
                  <label htmlFor="video-input" className="upload-label">
                    <strong>Choose a video</strong> or drag it here
                  </label>
                  <p className="file-types">Supported: MP4, MOV, AVI, WebM</p>
                </>
              ) : (
                <>
                  <div className="file-info">
                    <div className="success-icon">✓</div>
                    <h3>{selectedFile.name}</h3>
                    <p>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <button className="change-file-btn" onClick={() => setSelectedFile(null)}>
                      Change File
                    </button>
                  </div>
                </>
              )}
            </div>

            {selectedFile && (
              <button className="upload-btn" onClick={handleUpload}>
                Start Processing
              </button>
            )}
          </>
        )}

        <div className="features">
          <h3>What happens next?</h3>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <div>
                <strong>AI Detection</strong>
                <p>Automatically detect serves, rallies, and scores</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎾</span>
              <div>
                <strong>Court Selection</strong>
                <p>Identify and isolate specific courts in multi-court recordings</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✂️</span>
              <div>
                <strong>Smart Editing</strong>
                <p>Trim, speed up, or remove idle segments automatically</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <div>
                <strong>Highlight Reels</strong>
                <p>Generate personalized highlight videos of your best moments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoUploader
