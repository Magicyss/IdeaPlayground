import { useState } from 'react'
import './App.css'
import VideoUploader from './components/VideoUploader'
import VideoTimeline from './components/VideoTimeline'
import ExportPanel from './components/ExportPanel'

// API configuration - can be overridden via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [segments, setSegments] = useState([])
  const [currentView, setCurrentView] = useState('upload') // upload, edit, export
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoId, setVideoId] = useState(null)
  
  // Check if local mode is enabled
  const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true'
  
  const handleLocalPath = async (filePathOrFile) => {
    setAnalysisError(null)
    setAnalysisProgress(0)
    
    // Show edit view immediately with loading state
    setCurrentView('edit')
    setIsAnalyzing(true)
    
    try {
      let filePath = filePathOrFile
      let fileToUse = null
      
      // If it's a File object (from file browser), extract path or use file directly
      if (filePathOrFile instanceof File) {
        fileToUse = filePathOrFile
        // Try to get full path (webkitRelativePath or path property)
        // Note: browsers don't expose full path for security reasons
        // We'll send the file name and the File object
        filePath = filePathOrFile.webkitRelativePath || filePathOrFile.name
        
        // Create object URL for video preview
        const url = URL.createObjectURL(fileToUse)
        setVideoUrl(url)
        setVideoFile(fileToUse)
      }
      
      // Analyze video directly from local path
      const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze-local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          video_path: filePath,
          file_name: fileToUse ? fileToUse.name : filePath.split(/[/\\]/).pop()
        })
      })
      
      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || 'Failed to analyze video')
      }
      
      const analysisData = await analyzeResponse.json()
      setSegments(analysisData.segments)
      setVideoId(analysisData.video_id)
      setAnalysisProgress(100)
      setIsAnalyzing(false)
      
      // If we don't have a file object, set video URL to local path (for display purposes)
      if (!fileToUse) {
        setVideoUrl(`file:///${filePath}`)
      }
      
    } catch (error) {
      console.error('Error processing local video:', error)
      setAnalysisError(error.message)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      setCurrentView('upload')
    }
  }

  const handleVideoUpload = async (file) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setAnalysisError(null)
    setAnalysisProgress(0)
    
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
      setVideoId(newVideoId)
      
      // Start progress polling
      const progressInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`${API_BASE_URL}/api/progress/${newVideoId}`)
          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            setAnalysisProgress(progressData.progress)
          }
        } catch (err) {
          console.error('Error fetching progress:', err)
        }
      }, 1000) // Poll every second
      
      // Analyze video using AI
      const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ video_id: newVideoId })
      })
      
      // Stop progress polling
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
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
      setAnalysisProgress(0)
      setUploadProgress(0)
      
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
      video.onerror = () => {
        console.error('Failed to load video metadata')
        // Create default segments based on assumption
        const demoSegments = [
          { id: 1, start: 0, end: 30, type: 'serve', court: 1, confidence: 0.75 },
          { id: 2, start: 30, end: 60, type: 'rally', court: 2, confidence: 0.75 },
          { id: 3, start: 60, end: 90, type: 'score', court: 1, confidence: 0.75 }
        ]
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
          <VideoUploader 
            onVideoUpload={handleVideoUpload}
            onLocalPath={handleLocalPath}
          />
        )}

        {currentView === 'edit' && videoUrl && (
          <VideoTimeline
            videoUrl={videoUrl}
            segments={segments}
            onSegmentUpdate={handleSegmentUpdate}
            onExport={() => setCurrentView('export')}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            analysisProgress={analysisProgress}
            uploadProgress={uploadProgress}
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
