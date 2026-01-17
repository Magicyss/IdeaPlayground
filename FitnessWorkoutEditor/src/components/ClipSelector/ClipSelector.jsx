import { useState, useRef, useEffect } from 'react';
import './ClipSelector.css';

function ClipSelector({ videos, onSelectClip, onCancel }) {
  const [selectedVideo, setSelectedVideo] = useState(videos[0] || null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      setEndTime(Math.min(30, selectedVideo.duration)); // Default 30s or video duration
    }
  }, [selectedVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Loop the clip selection
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime]);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setStartTime(0);
    setEndTime(Math.min(30, video.duration));
  };

  const handleSetStart = () => {
    if (videoRef.current) {
      setStartTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= endTime) {
        setEndTime(Math.min(videoRef.current.currentTime + 10, selectedVideo.duration));
      }
    }
  };

  const handleSetEnd = () => {
    if (videoRef.current) {
      setEndTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    const clipData = {
      videoId: selectedVideo.id,
      fileName: selectedVideo.fileName,
      startTime: Math.round(startTime * 10) / 10,
      endTime: Math.round(endTime * 10) / 10,
      duration: Math.round((endTime - startTime) * 10) / 10,
      videoUrl: selectedVideo.url,
    };

    onSelectClip(clipData);
  };

  if (!selectedVideo) {
    return (
      <div className="clip-selector-overlay">
        <div className="clip-selector card">
          <p>No videos available. Please import videos first.</p>
          <button className="primary-button" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clip-selector-overlay">
      <div className="clip-selector card">
        <div className="selector-header">
          <h3>Select Video Clip</h3>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <div className="video-selection">
          <label>Choose Video:</label>
          <select
            value={selectedVideo.id}
            onChange={(e) => {
              const video = videos.find(v => v.id === e.target.value);
              handleVideoSelect(video);
            }}
          >
            {videos.map(video => (
              <option key={video.id} value={video.id}>
                {video.fileName}
              </option>
            ))}
          </select>
        </div>

        <div className="video-preview">
          <video
            ref={videoRef}
            src={selectedVideo.url}
            controls
            className="preview-video"
          />
        </div>

        <div className="timeline-controls">
          <div className="time-display">
            <span>Current: {formatTime(currentTime)}</span>
            <span>Duration: {formatTime(selectedVideo.duration)}</span>
          </div>

          <div className="clip-markers">
            <div className="marker-group">
              <label>Start Time: {formatTime(startTime)}</label>
              <input
                type="range"
                min="0"
                max={selectedVideo.duration}
                step="0.1"
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value))}
              />
              <button className="secondary-button" onClick={handleSetStart}>
                Set as Start
              </button>
            </div>

            <div className="marker-group">
              <label>End Time: {formatTime(endTime)}</label>
              <input
                type="range"
                min="0"
                max={selectedVideo.duration}
                step="0.1"
                value={endTime}
                onChange={(e) => setEndTime(parseFloat(e.target.value))}
              />
              <button className="secondary-button" onClick={handleSetEnd}>
                Set as End
              </button>
            </div>
          </div>

          <div className="clip-info">
            <p>Selected Clip: {formatTime(startTime)} - {formatTime(endTime)}</p>
            <p>Clip Duration: {formatTime(endTime - startTime)}</p>
          </div>
        </div>

        <div className="selector-actions">
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleConfirm}>
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClipSelector;
