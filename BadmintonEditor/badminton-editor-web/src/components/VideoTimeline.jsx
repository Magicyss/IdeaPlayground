import { useState, useRef, useEffect } from 'react'
import './VideoTimeline.css'

function VideoTimeline({ videoUrl, segments, onSegmentUpdate, onExport, isAnalyzing, analysisError, analysisProgress = 0, uploadProgress = 0 }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [selectedCourt, setSelectedCourt] = useState('all')
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handleTimeUpdate = () => setCurrentTime(video.currentTime)
      const handleLoadedMetadata = () => setDuration(video.duration)
      
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [videoUrl])

  const togglePlay = () => {
    const video = videoRef.current
    if (video) {
      if (playing) {
        video.pause()
      } else {
        video.play()
      }
      setPlaying(!playing)
    }
  }

  const handleSeek = (time) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSegmentColor = (type) => {
    switch (type) {
      case 'serve': return '#3498db'
      case 'rally': return '#2ecc71'
      case 'score': return '#e74c3c'
      default: return '#95a5a6'
    }
  }

  const filteredSegments = selectedCourt === 'all' 
    ? segments 
    : segments.filter(seg => seg.court === parseInt(selectedCourt))

  const courts = [...new Set(segments.map(seg => seg.court))].sort()

  const handleRemoveSegment = (segmentId) => {
    const updatedSegments = segments.filter(seg => seg.id !== segmentId)
    onSegmentUpdate(updatedSegments)
  }

  return (
    <div className="video-timeline">
      <div className="timeline-header">
        <h2>Edit Your Video</h2>
        <div className="court-selector">
          <label>Court Filter:</label>
          <select value={selectedCourt} onChange={(e) => setSelectedCourt(e.target.value)}>
            <option value="all">All Courts</option>
            {courts.map(court => (
              <option key={court} value={court}>Court {court}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="video-player-section">
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            className="video-player"
            onClick={togglePlay}
          />
          <div className="video-controls">
            <button className="play-btn" onClick={togglePlay}>
              {playing ? '⏸' : '▶️'}
            </button>
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="seek-bar"
            />
          </div>
        </div>

        <div className="segment-info">
          <h3>Detected Segments ({filteredSegments.length})</h3>
          {isAnalyzing ? (
            <div className="ai-note analyzing">
              {uploadProgress < 100 ? (
                <>
                  <strong>📤 上传中... / Uploading...</strong>
                  <div className="progress-bar-container" style={{ margin: '1rem 0' }}>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill upload" 
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress > 0 && `${uploadProgress}%`}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      Uploading video to server...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <strong>🤖 AI分析中... / Analyzing with AI...</strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    使用OpenCV进行运动检测，识别发球、得分和比赛关键时刻。
                  </p>
                  <div className="progress-bar-container" style={{ margin: '1rem 0' }}>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${analysisProgress}%` }}
                      >
                        {analysisProgress > 0 && `${analysisProgress}%`}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      Processing frames for speed optimization (every 3rd frame analyzed)
                    </p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', opacity: 0.7 }}>
                      ⚙️ CPU-based analysis. For 10-50x speedup, see performance guide.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : analysisError ? (
            <div className="ai-note error">
              <strong>⚠️ AI分析失败 / AI Analysis Failed</strong>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                无法连接到AI后端服务。使用本地演示片段。错误: {analysisError}
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                Cannot connect to AI backend. Using local demo segments. Error: {analysisError}
              </p>
            </div>
          ) : (
            <>
              <p className="ai-note success">
                <strong>✅ AI分析完成 / AI Analysis Complete</strong>
              </p>
              <p className="ai-note" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                使用OpenCV运动检测技术分析视频，识别出{filteredSegments.length}个片段。
                Analyzed using OpenCV motion detection. {filteredSegments.length} segments detected.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="timeline-visualization">
        <div className="timeline-track" style={{ position: 'relative', height: '80px', background: '#ecf0f1', borderRadius: '8px', marginTop: '1rem' }}>
          {filteredSegments.map(segment => {
            const left = (segment.start / duration) * 100
            const width = ((segment.end - segment.start) / duration) * 100
            return (
              <div
                key={segment.id}
                className="segment-block"
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${width}%`,
                  height: '100%',
                  background: getSegmentColor(segment.type),
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}
                onClick={() => handleSeek(segment.start)}
                title={`${segment.type} - Court ${segment.court} (${formatTime(segment.start)} - ${formatTime(segment.end)})`}
              >
                {width > 5 && segment.type}
              </div>
            )
          })}
        </div>

        <div className="timeline-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#3498db' }}></div>
            <span>Serve</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#2ecc71' }}></div>
            <span>Rally</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#e74c3c' }}></div>
            <span>Score</span>
          </div>
        </div>
      </div>

      <div className="segments-list">
        <h3>Segment Details</h3>
        <div className="segments-grid">
          {filteredSegments.map(segment => (
            <div key={segment.id} className="segment-card">
              <div className="segment-header">
                <span className="segment-type" style={{ color: getSegmentColor(segment.type) }}>
                  {segment.type.toUpperCase()}
                </span>
                <span className="segment-court">Court {segment.court}</span>
              </div>
              <div className="segment-time">
                {formatTime(segment.start)} → {formatTime(segment.end)}
              </div>
              <div className="segment-actions">
                <button 
                  className="action-btn jump-btn" 
                  onClick={() => handleSeek(segment.start)}
                >
                  Jump to
                </button>
                <button 
                  className="action-btn remove-btn" 
                  onClick={() => handleRemoveSegment(segment.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="export-section">
        <button className="export-button" onClick={onExport}>
          Proceed to Export →
        </button>
      </div>
    </div>
  )
}

export default VideoTimeline
