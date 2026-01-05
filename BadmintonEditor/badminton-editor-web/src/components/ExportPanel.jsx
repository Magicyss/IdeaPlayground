import { useState } from 'react'
import './ExportPanel.css'

function ExportPanel({ videoFile, segments, onExport }) {
  const [exportSettings, setExportSettings] = useState({
    quality: 'high',
    format: 'mp4',
    includeAllSegments: true,
    highlightsOnly: false,
    speedUpIdle: false
  })

  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportComplete, setExportComplete] = useState(false)

  const handleSettingChange = (setting, value) => {
    setExportSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  const handleExport = () => {
    setExporting(true)
    setExportProgress(0)

    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setExporting(false)
          setExportComplete(true)
          return 100
        }
        return prev + 10
      })
    }, 500)

    // Call parent handler
    onExport(exportSettings)
  }

  const downloadVideo = () => {
    // In a real implementation, this would download the processed video
    alert('Download functionality would be implemented here with the actual processed video file.')
  }

  const estimatedSize = () => {
    const baseSize = videoFile.size / (1024 * 1024) // MB
    const qualityMultiplier = exportSettings.quality === 'high' ? 1 : exportSettings.quality === 'medium' ? 0.6 : 0.3
    return (baseSize * qualityMultiplier * (exportSettings.includeAllSegments ? 1 : 0.5)).toFixed(2)
  }

  return (
    <div className="export-panel">
      <div className="export-card">
        <h2>Export Your Video</h2>
        <p className="export-description">
          Configure your export settings and generate your final badminton video.
        </p>

        {!exportComplete ? (
          <>
            <div className="export-settings">
              <div className="setting-group">
                <h3>Quality Settings</h3>
                <div className="setting-item">
                  <label>Video Quality:</label>
                  <select 
                    value={exportSettings.quality} 
                    onChange={(e) => handleSettingChange('quality', e.target.value)}
                    disabled={exporting}
                  >
                    <option value="high">High (1080p)</option>
                    <option value="medium">Medium (720p)</option>
                    <option value="low">Low (480p)</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Format:</label>
                  <select 
                    value={exportSettings.format} 
                    onChange={(e) => handleSettingChange('format', e.target.value)}
                    disabled={exporting}
                  >
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="mov">MOV</option>
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <h3>Content Settings</h3>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="includeAll"
                    checked={exportSettings.includeAllSegments}
                    onChange={(e) => handleSettingChange('includeAllSegments', e.target.checked)}
                    disabled={exporting}
                  />
                  <label htmlFor="includeAll">Include all segments</label>
                </div>

                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="highlightsOnly"
                    checked={exportSettings.highlightsOnly}
                    onChange={(e) => handleSettingChange('highlightsOnly', e.target.checked)}
                    disabled={exporting}
                  />
                  <label htmlFor="highlightsOnly">Export highlights only</label>
                </div>

                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="speedUpIdle"
                    checked={exportSettings.speedUpIdle}
                    onChange={(e) => handleSettingChange('speedUpIdle', e.target.checked)}
                    disabled={exporting}
                  />
                  <label htmlFor="speedUpIdle">Speed up idle segments (2x)</label>
                </div>
              </div>

              <div className="export-summary">
                <h3>Export Summary</h3>
                <div className="summary-row">
                  <span>Original File:</span>
                  <strong>{videoFile.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Segments to Export:</span>
                  <strong>{segments.length} segments</strong>
                </div>
                <div className="summary-row">
                  <span>Estimated Size:</span>
                  <strong>{estimatedSize()} MB</strong>
                </div>
                <div className="summary-row">
                  <span>Quality:</span>
                  <strong>{exportSettings.quality.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            {exporting ? (
              <div className="export-progress">
                <h3>Exporting Video...</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p>{exportProgress}% complete</p>
                <div className="processing-steps">
                  <div className={exportProgress >= 20 ? 'step complete' : 'step'}>
                    ✓ Analyzing segments
                  </div>
                  <div className={exportProgress >= 40 ? 'step complete' : 'step'}>
                    {exportProgress >= 40 ? '✓' : '⋯'} Processing video
                  </div>
                  <div className={exportProgress >= 70 ? 'step complete' : 'step'}>
                    {exportProgress >= 70 ? '✓' : '⋯'} Applying effects
                  </div>
                  <div className={exportProgress >= 100 ? 'step complete' : 'step'}>
                    {exportProgress >= 100 ? '✓' : '⋯'} Finalizing export
                  </div>
                </div>
              </div>
            ) : (
              <button className="export-btn" onClick={handleExport}>
                Start Export
              </button>
            )}
          </>
        ) : (
          <div className="export-complete">
            <div className="success-icon-large">✓</div>
            <h3>Export Complete!</h3>
            <p>Your video has been processed and is ready to download.</p>
            
            <div className="complete-actions">
              <button className="download-btn" onClick={downloadVideo}>
                📥 Download Video
              </button>
              <button className="share-btn" onClick={() => alert('Share functionality would integrate with social platforms')}>
                📤 Share to Social Media
              </button>
            </div>

            <div className="export-details">
              <h4>Export Details</h4>
              <div className="detail-row">
                <span>Format:</span>
                <span>{exportSettings.format.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span>Quality:</span>
                <span>{exportSettings.quality.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span>Size:</span>
                <span>{estimatedSize()} MB</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExportPanel
