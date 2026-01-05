import { useState } from 'react'
import './App.css'
import VideoUploader from './components/VideoUploader'
import VideoTimeline from './components/VideoTimeline'
import ExportPanel from './components/ExportPanel'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [segments, setSegments] = useState([])
  const [currentView, setCurrentView] = useState('upload') // upload, edit, export

  const handleVideoUpload = (file) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    
    // Get video duration to generate realistic demo segments
    const video = document.createElement('video')
    video.src = url
    video.onloadedmetadata = () => {
      const duration = video.duration
      
      // Generate demo segments based on actual video duration
      // Note: These are DEMO segments. Real AI detection will be implemented in future updates.
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
          court: courts[i % courts.length]
        })
      }
      
      setSegments(demoSegments)
      setCurrentView('edit')
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
