import { useState } from 'react'
import './VideoUploader.css'

function VideoUploader({ onVideoUpload }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

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

  return (
    <div className="video-uploader">
      <div className="upload-card">
        <h2>Upload Your Badminton Match Video</h2>
        <p className="upload-description">
          上传您的羽毛球比赛视频。当前为<strong>演示版本</strong>，视频片段会根据时长自动生成，未来将集成AI来检测发球、得分等关键时刻。
        </p>
        <p className="upload-description" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Upload your badminton match video. This is a <strong>DEMO version</strong> - segments are auto-generated. 
          Future updates will include real AI detection for serves, scores, and key moments.
        </p>

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
