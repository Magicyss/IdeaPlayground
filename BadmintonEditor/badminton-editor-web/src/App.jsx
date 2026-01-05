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
    setCurrentView('edit')
    
    // Initialize with default segments (placeholder for AI detection)
    setSegments([
      { id: 1, start: 0, end: 30, type: 'serve', court: 1 },
      { id: 2, start: 30, end: 60, type: 'rally', court: 1 },
      { id: 3, start: 60, end: 90, type: 'serve', court: 2 }
    ])
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
