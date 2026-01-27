import { useTranslation } from '../../i18n/I18nContext';
import { calculateTotalDuration } from '../../services/videoExport/exportPipeline';

function ExportSettings({ exercises, settings, onSettingsChange, onStartExport }) {
  const { t } = useTranslation();

  const estimatedDuration = calculateTotalDuration(exercises, settings.includeRest);
  const minutes = Math.floor(estimatedDuration / 60);
  const seconds = Math.round(estimatedDuration % 60);

  return (
    <div className="export-settings">
      <div className="setting-group">
        <label className="setting-label">{t('export.resolution')}</label>
        <select
          className="setting-select"
          value={settings.resolution}
          onChange={(e) => onSettingsChange({ ...settings, resolution: e.target.value })}
        >
          <option value="720p">720p (1280×720)</option>
          <option value="1080p">1080p (1920×1080)</option>
          <option value="4k">4K (3840×2160)</option>
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
