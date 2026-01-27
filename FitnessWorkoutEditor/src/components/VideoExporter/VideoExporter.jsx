import { useState, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { isSupported, terminate } from '../../services/videoExport/ffmpegService';
import { exportWorkout, STAGES } from '../../services/videoExport/exportPipeline';
import ExportSettings from './ExportSettings';
import ExportProgress from './ExportProgress';
import './VideoExporter.css';

function VideoExporter({ exercises, videos, workoutName, onClose }) {
  const { t } = useTranslation();
  const translations = { t };

  const [exportState, setExportState] = useState('settings'); // 'settings' | 'exporting' | 'complete' | 'error'
  const [settings, setSettings] = useState({
    resolution: '1080p',
    frameRate: '30',
    format: 'mp4',
    includeRest: true,
  });
  const [progress, setProgress] = useState({ stage: STAGES.INITIALIZING, message: '' });
  const [outputBlob, setOutputBlob] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const abortControllerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Check browser support
  const browserSupported = isSupported();

  const handleStartExport = async () => {
    if (!browserSupported) {
      setErrorMessage(t('export.browserNotSupported'));
      setExportState('error');
      return;
    }

    setExportState('exporting');
    setProgress({ stage: STAGES.INITIALIZING, message: '' });
    isCancelledRef.current = false;

    abortControllerRef.current = new AbortController();

    try {
      const blob = await exportWorkout({
        exercises,
        videos,
        includeRest: settings.includeRest,
        resolution: settings.resolution,
        frameRate: settings.frameRate,
        translations,
        onProgress: setProgress,
        signal: abortControllerRef.current.signal,
      });

      if (!isCancelledRef.current) {
        setOutputBlob(blob);
        setExportState('complete');
      }
    } catch (error) {
      if (error.message === 'Export cancelled' || isCancelledRef.current) {
        setExportState('settings');
      } else {
        console.error('Export error:', error);
        setErrorMessage(error.message);
        setExportState('error');
      }
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Force terminate FFmpeg
    terminate();
    setExportState('settings');
  };

  const handleClose = () => {
    // If exporting, cancel first
    if (exportState === 'exporting') {
      handleCancel();
    }
    onClose();
  };

  const handleDownload = () => {
    if (!outputBlob) return;

    const url = URL.createObjectURL(outputBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workoutName.replace(/\s+/g, '_')}_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    setExportState('settings');
    setErrorMessage('');
    setProgress({ stage: STAGES.INITIALIZING, message: '' });
  };

  return (
    <div className="video-exporter-overlay" onClick={handleClose}>
      <div className="video-exporter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('export.videoExport')}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {!browserSupported && exportState === 'settings' && (
            <div className="browser-warning">
              <p>{t('export.browserNotSupported')}</p>
            </div>
          )}

          {exportState === 'settings' && browserSupported && (
            <ExportSettings
              exercises={exercises}
              settings={settings}
              onSettingsChange={setSettings}
              onStartExport={handleStartExport}
            />
          )}

          {exportState === 'exporting' && (
            <ExportProgress
              progress={progress}
              onCancel={handleCancel}
            />
          )}

          {exportState === 'complete' && (
            <div className="export-complete">
              <div className="success-icon">✓</div>
              <p className="success-message">{t('export.complete')}</p>
              <button className="primary-button download-button" onClick={handleDownload}>
                {t('export.download')}
              </button>
            </div>
          )}

          {exportState === 'error' && (
            <div className="export-error">
              <div className="error-icon">!</div>
              <p className="error-message">{t('export.error')}</p>
              {errorMessage && <p className="error-detail">{errorMessage}</p>}
              <button className="secondary-button" onClick={handleRetry}>
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoExporter;
