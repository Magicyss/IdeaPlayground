import { useRef, useState } from 'react';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useTranslation } from '../../i18n/I18nContext';
import { detectPlatform, parseVideoUrl } from '../../utils/videoPlatform';
import './VideoImporter.css';

function VideoImporter() {
  const { state, dispatch, ACTIONS } = useWorkout();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      // Check if video format is supported
      if (!file.type.startsWith('video/')) {
        alert(`${file.name} ${t('video.invalidFormat')}`);
        continue;
      }

      // Check file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        alert(`${file.name} ${t('video.tooLarge')}`);
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
          type: 'local',
          file,
          fileName: file.name,
          url, // Keep the URL, don't revoke it - we need it for playback
          duration: video.duration,
          size: file.size,
          width: video.videoWidth,
          height: video.videoHeight,
        };

        dispatch({ type: ACTIONS.ADD_VIDEO, payload: videoData });

        // Link this video to any imported exercises that match by filename
        dispatch({
          type: ACTIONS.LINK_VIDEO_TO_EXERCISES,
          payload: {
            videoId: videoData.id,
            videoUrl: videoData.url,
            fileName: videoData.fileName,
          },
        });
        // Don't revoke the URL here - it's needed for video playback
      };
      
      video.src = url;
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = (id) => {
    if (confirm(t('video.remove'))) {
      dispatch({ type: ACTIONS.REMOVE_VIDEO, payload: id });
    }
  };

  const handleParseUrl = async () => {
    if (!videoUrl.trim()) {
      return;
    }

    setIsParsing(true);

    try {
      // Parse the video URL
      const videoInfo = await parseVideoUrl(videoUrl);

      // Create video data object for online video
      const videoData = {
        id: Date.now().toString() + Math.random(),
        type: 'online',
        fileName: videoInfo.title || `${videoInfo.platformName} Video`,
        url: videoInfo.embedUrl || videoInfo.originalUrl,
        originalUrl: videoInfo.originalUrl,
        duration: videoInfo.duration || 0,
        platform: videoInfo.platform,
        platformName: videoInfo.platformName,
        videoId: videoInfo.videoId,
        embedUrl: videoInfo.embedUrl,
        thumbnail: videoInfo.thumbnail,
        supportsEmbed: videoInfo.supportsEmbed,
        size: 0, // Online videos don't have size info
      };

      dispatch({ type: ACTIONS.ADD_VIDEO, payload: videoData });

      // Clear the input
      setVideoUrl('');
      alert(t('video.parseSuccess'));
    } catch (error) {
      console.error('Error parsing video URL:', error);
      alert(t('video.parseError'));
    } finally {
      setIsParsing(false);
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
          {t('video.import')}
        </label>
        <p className="import-hint">
          {t('builder.supportedFormats')}
        </p>

        <div className="url-input-section">
          <label className="url-label">{t('video.urlInput')}</label>
          <div className="url-input-group">
            <input
              type="text"
              className="url-input"
              placeholder={t('video.urlPlaceholder')}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleParseUrl();
                }
              }}
              disabled={isParsing}
            />
            <button
              className="parse-button"
              onClick={handleParseUrl}
              disabled={isParsing || !videoUrl.trim()}
            >
              {isParsing ? t('video.parsing') : t('video.parseUrl')}
            </button>
          </div>
        </div>
      </div>

      {state.videos.length > 0 && (
        <div className="video-list">
          {state.videos.map((video) => (
            <div key={video.id} className="video-item card">
              <div className="video-info">
                <div className="video-name">
                  <strong>{video.fileName}</strong>
                  {video.type && (
                    <span className={`video-type-badge ${video.type}`}>
                      {video.type === 'online' ? t('video.online') : t('video.local')}
                    </span>
                  )}
                </div>
                <div className="video-meta">
                  <span>{t('video.duration')} {formatDuration(video.duration)}</span>
                  {video.size > 0 && (
                    <span>{t('video.size')} {formatFileSize(video.size)}</span>
                  )}
                  {video.platformName && (
                    <span>{video.platformName}</span>
                  )}
                </div>
              </div>
              <button
                className="remove-video-button"
                onClick={() => handleRemoveVideo(video.id)}
                title={t('video.remove')}
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
