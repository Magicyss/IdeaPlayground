import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import './ClipSelector.css';

function ClipSelector({ videos, onSelectClip, onCancel }) {
  const { t } = useTranslation();
  const [selectedVideo, setSelectedVideo] = useState(videos[0] || null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      setEndTime(selectedVideo.duration); // Default to video end
    }
  }, [selectedVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Don't auto-loop - let user control playback
      // Removed auto-jump to start when reaching end
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime]);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setStartTime(0);
    setEndTime(video.duration); // Default to video end
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const parseTimeInput = (timeStr) => {
    // Parse hh:mm:ss.xxx or mm:ss.xxx format
    const parts = timeStr.split(':');
    let hours = 0, mins = 0, secs = 0;
    
    if (parts.length === 3) {
      // hh:mm:ss.xxx format
      hours = parseInt(parts[0]) || 0;
      mins = parseInt(parts[1]) || 0;
      const secParts = parts[2].split('.');
      secs = parseInt(secParts[0]) || 0;
      const ms = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3)) || 0 : 0;
      return hours * 3600 + mins * 60 + secs + ms / 1000;
    } else if (parts.length === 2) {
      // mm:ss.xxx format
      mins = parseInt(parts[0]) || 0;
      const secParts = parts[1].split('.');
      secs = parseInt(secParts[0]) || 0;
      const ms = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3)) || 0 : 0;
      return mins * 60 + secs + ms / 1000;
    }
    return 0;
  };

  const handleTimeInputChange = (value, isStart) => {
    const timeInSeconds = parseTimeInput(value);
    if (!isNaN(timeInSeconds) && timeInSeconds >= 0 && timeInSeconds <= selectedVideo.duration) {
      if (isStart) {
        setStartTime(timeInSeconds);
      } else {
        setEndTime(timeInSeconds);
      }
    }
  };

  const handleConfirm = () => {
    if (startTime >= endTime) {
      alert(t('clip.errorEndTime'));
      return;
    }

    const clipData = {
      videoId: selectedVideo.id,
      fileName: selectedVideo.fileName,
      startTime: Math.round(startTime * 1000) / 1000, // Round to milliseconds
      endTime: Math.round(endTime * 1000) / 1000,
      duration: Math.round((endTime - startTime) * 1000) / 1000,
      videoUrl: selectedVideo.url,
    };

    onSelectClip(clipData);
  };

  if (!selectedVideo) {
    return (
      <div className="clip-selector-overlay">
        <div className="clip-selector card">
          <p>{t('clip.noVideos')}</p>
          <button className="primary-button" onClick={onCancel}>
            {t('clip.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clip-selector-overlay">
      <div className="clip-selector card">
        <div className="selector-header">
          <h3>{t('clip.selectClip')}</h3>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <div className="video-selection">
          <label>{t('clip.chooseVideo')}</label>
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
            <span>{t('clip.current')}: {formatTime(currentTime)}</span>
            <span>{t('clip.duration')}: {formatTime(selectedVideo.duration)}</span>
          </div>

          <div className="clip-markers">
            <div className="marker-group">
              <label>{t('clip.startTime')}: {formatTime(startTime)}</label>
              <input
                type="text"
                className="time-input"
                placeholder="mm:ss.xxx or hh:mm:ss.xxx"
                onBlur={(e) => handleTimeInputChange(e.target.value, true)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTimeInputChange(e.target.value, true);
                    e.target.blur();
                  }
                }}
              />
              <input
                type="range"
                min="0"
                max={selectedVideo.duration}
                step="0.001"
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value))}
              />
              <button className="secondary-button" onClick={handleSetStart}>
                {t('clip.setAsStart')}
              </button>
            </div>

            <div className="marker-group">
              <label>{t('clip.endTime')}: {formatTime(endTime)}</label>
              <input
                type="text"
                className="time-input"
                placeholder="mm:ss.xxx or hh:mm:ss.xxx"
                onBlur={(e) => handleTimeInputChange(e.target.value, false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTimeInputChange(e.target.value, false);
                    e.target.blur();
                  }
                }}
              />
              <input
                type="range"
                min="0"
                max={selectedVideo.duration}
                step="0.001"
                value={endTime}
                onChange={(e) => setEndTime(parseFloat(e.target.value))}
              />
              <button className="secondary-button" onClick={handleSetEnd}>
                {t('clip.setAsEnd')}
              </button>
            </div>
          </div>

          <div className="clip-info">
            <p>{t('clip.selectedClip')}: {formatTime(startTime)} - {formatTime(endTime)}</p>
            <p>{t('clip.clipDuration')}: {formatTime(endTime - startTime)}</p>
          </div>
        </div>

        <div className="selector-actions">
          <button className="secondary-button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="primary-button" onClick={handleConfirm}>
            {t('clip.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClipSelector;
