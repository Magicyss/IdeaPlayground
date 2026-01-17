import { useRef } from 'react';
import { useWorkout } from '../../contexts/WorkoutContext';
import './VideoImporter.css';

function VideoImporter() {
  const { state, dispatch, ACTIONS } = useWorkout();
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      // Check if video format is supported
      if (!file.type.startsWith('video/')) {
        alert(`${file.name} is not a valid video file`);
        continue;
      }

      // Check file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        alert(`${file.name} is too large. Please use videos smaller than 500MB.`);
        continue;
      }

      // Create object URL for video preview
      const url = URL.createObjectURL(file);
      
      // Get video metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const videoData = {
          id: Date.now().toString() + Math.random(),
          file,
          fileName: file.name,
          url,
          duration: video.duration,
          size: file.size,
        };
        
        dispatch({ type: ACTIONS.ADD_VIDEO, payload: videoData });
        URL.revokeObjectURL(url);
      };
      
      video.src = url;
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = (id) => {
    if (confirm('Remove this video? Associated exercises will also be affected.')) {
      dispatch({ type: ACTIONS.REMOVE_VIDEO, payload: id });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-importer">
      <div className="import-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="video-input"
        />
        <label htmlFor="video-input" className="primary-button">
          📁 Import Videos
        </label>
        <p className="import-hint">
          Supported formats: MP4, MOV, AVI, WebM (Max 500MB per file)
        </p>
      </div>

      {state.videos.length > 0 && (
        <div className="video-list">
          {state.videos.map((video) => (
            <div key={video.id} className="video-item card">
              <div className="video-info">
                <div className="video-name">
                  <strong>{video.fileName}</strong>
                </div>
                <div className="video-meta">
                  <span>Duration: {formatDuration(video.duration)}</span>
                  <span>Size: {formatFileSize(video.size)}</span>
                </div>
              </div>
              <button
                className="remove-video-button"
                onClick={() => handleRemoveVideo(video.id)}
                title="Remove video"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VideoImporter;
