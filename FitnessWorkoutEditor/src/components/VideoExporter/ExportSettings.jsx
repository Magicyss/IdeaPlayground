import { useTranslation } from '../../i18n/I18nContext';
import { calculateTotalDuration } from '../../services/videoExport/index.js';

function ExportSettings({ exercises, settings, onSettingsChange, onStartExport }) {
  const { t } = useTranslation();

  const estimatedDuration = calculateTotalDuration(exercises, settings.includeRest);
  const minutes = Math.floor(estimatedDuration / 60);
  const seconds = Math.round(estimatedDuration % 60);

  const isPortrait = settings.orientation === 'portrait';

  const getResolutionValue = () => {
    const base = settings.resolution.replace('-portrait', '');
    return base;
  };

  const handleResolutionChange = (baseResolution) => {
    const newResolution = isPortrait ? `${baseResolution}-portrait` : baseResolution;
    onSettingsChange({ ...settings, resolution: newResolution });
  };

  const handleOrientationChange = (orientation) => {
    const baseResolution = settings.resolution.replace('-portrait', '');
    const newResolution = orientation === 'portrait' ? `${baseResolution}-portrait` : baseResolution;
    onSettingsChange({ ...settings, orientation, resolution: newResolution });
  };

  return (
    <div className="export-settings">
      <div className="setting-group">
        <label className="setting-label">{t('export.orientation')}</label>
        <select
          className="setting-select"
          value={settings.orientation || 'landscape'}
          onChange={(e) => handleOrientationChange(e.target.value)}
        >
          <option value="landscape">{t('export.landscape')}</option>
          <option value="portrait">{t('export.portrait')}</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">{t('export.resolution')}</label>
        <select
          className="setting-select"
          value={getResolutionValue()}
          onChange={(e) => handleResolutionChange(e.target.value)}
        >
          <option value="720p">720p {isPortrait ? '(720×1280)' : '(1280×720)'}</option>
          <option value="1080p">1080p {isPortrait ? '(1080×1920)' : '(1920×1080)'}</option>
          <option value="4k">4K {isPortrait ? '(2160×3840)' : '(3840×2160)'}</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">{t('export.frameRate')}</label>
        <select
          className="setting-select"
          value={settings.frameRate}
          onChange={(e) => onSettingsChange({ ...settings, frameRate: e.target.value })}
        >
          <option value="24">24 fps</option>
          <option value="30">30 fps</option>
          <option value="60">60 fps</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">{t('export.format')}</label>
        <select
          className="setting-select"
          value={settings.format}
          onChange={(e) => onSettingsChange({ ...settings, format: e.target.value })}
        >
          <option value="mp4">MP4</option>
        </select>
      </div>

      <div className="setting-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.includeRest}
            onChange={(e) => onSettingsChange({ ...settings, includeRest: e.target.checked })}
          />
          <span>{t('export.includeRest')}</span>
        </label>
      </div>

      <div className="setting-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.includeOriginalAudio ?? false}
            onChange={(e) => onSettingsChange({ ...settings, includeOriginalAudio: e.target.checked })}
          />
          <span>{t('export.includeOriginalAudio')}</span>
        </label>
      </div>

      <div className="setting-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.includeCountdownBeeps ?? true}
            onChange={(e) => onSettingsChange({ ...settings, includeCountdownBeeps: e.target.checked })}
          />
          <span>{t('export.includeCountdownBeeps')}</span>
        </label>
      </div>

      <div className="estimated-duration">
        <span className="duration-label">{t('export.estimatedDuration')}</span>
        <span className="duration-value">{minutes}m {seconds}s</span>
      </div>

      <button className="primary-button start-export-button" onClick={onStartExport}>
        {t('export.start')}
      </button>
    </div>
  );
}

export default ExportSettings;
