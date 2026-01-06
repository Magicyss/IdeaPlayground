import { useState } from 'react'
import './App.css'
import VideoUploader from './components/VideoUploader'
import VideoTimeline from './components/VideoTimeline'
import ExportPanel from './components/ExportPanel'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [segments, setSegments] = useState([])
  const [currentView, setCurrentView] = useState('upload') // upload, edit, export
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)

  const handleVideoUpload = async (file) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setAnalysisError(null)
    
    // Show edit view immediately with loading state
    setCurrentView('edit')
    setIsAnalyzing(true)
    
    try {
      // Upload video to backend
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video')
      }
      
      const uploadData = await uploadResponse.json()
      const newVideoId = uploadData.video_id
      
      // Analyze video using AI
      const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ video_id: newVideoId })
      })
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze video')
      }
      
      const analysisData = await analyzeResponse.json()
      setSegments(analysisData.segments)
      setIsAnalyzing(false)
      
    } catch (error) {
      console.error('Error processing video:', error)
      setAnalysisError(error.message)
      setIsAnalyzing(false)
      
      // Fallback to local demo segments if backend fails
      const video = document.createElement('video')
      video.src = url
      video.onloadedmetadata = () => {
        const duration = video.duration
        const demoSegments = []
        const segmentCount = Math.min(5, Math.max(3, Math.floor(duration / 20)))
        const segmentDuration = duration / segmentCount
        
        for (let i = 0; i < segmentCount; i++) {
          const types = ['serve', 'rally', 'score']
          const courts = [1, 2]
          demoSegments.push({
            id: i + 1,
            start: i * segmentDuration,
            end: (i + 1) * segmentDuration,
            type: types[i % types.length],
            court: courts[i % courts.length],
            confidence: 0.75
          })
        }
        
        setSegments(demoSegments)
      }
    }
  }

  const handleSegmentUpdate = (updatedSegments) => {
    setSegments(updatedSegments)
  }

  const handleExport = (exportSettings) => {
    console.log('Exporting with settings:', exportSettings)
    setCurrentView('export')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏸 Badminton Video Editor</h1>
        <p className="tagline">AI-powered video editing for badminton matches</p>
      </header>

      <nav className="app-nav">
        <button 
          className={currentView === 'upload' ? 'active' : ''} 
          onClick={() => setCurrentView('upload')}
        >
          Upload
        </button>
        <button 
          className={currentView === 'edit' ? 'active' : ''} 
          onClick={() => setCurrentView('edit')}
          disabled={!videoFile}
        >
          Edit
        </button>
        <button 
          className={currentView === 'export' ? 'active' : ''} 
          onClick={() => setCurrentView('export')}
          disabled={!videoFile}
        >
          Export
        </button>
      </nav>

      <main className="app-content">
        {currentView === 'upload' && (
          <VideoUploader onVideoUpload={handleVideoUpload} />
        )}

        {currentView === 'edit' && videoUrl && (
          <VideoTimeline
            videoUrl={videoUrl}
            segments={segments}
            onSegmentUpdate={handleSegmentUpdate}
            onExport={() => setCurrentView('export')}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
          />
        )}

        {currentView === 'export' && (
          <ExportPanel
            videoFile={videoFile}
            segments={segments}
            onExport={handleExport}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Multi-platform support: Web • Mobile (Coming Soon) • Desktop (Coming Soon)</p>
      </footer>
    </div>
  )
}

export default App
