import { useTranslation } from '../../i18n/I18nContext';
import { STAGES } from '../../services/videoExport/index.js';

function ExportProgress({ progress, onCancel }) {
  const { t } = useTranslation();

  const getStageLabel = (stage) => {
    switch (stage) {
      case STAGES.INITIALIZING:
        return t('export.preparing');
      case STAGES.PROCESSING:
        return t('export.processing');
      case STAGES.ENCODING:
        return t('export.encoding');
      case STAGES.COMPLETE:
        return t('export.complete');
      case STAGES.ERROR:
        return t('export.error');
      default:
        return t('export.preparing');
    }
  };

  const getProgressPercent = () => {
    if (progress.stage === STAGES.COMPLETE) return 100;
    if (progress.stage === STAGES.ERROR) return 0;

    if (progress.stage === STAGES.PROCESSING && progress.totalExercises) {
      return Math.round((progress.exerciseIndex / progress.totalExercises) * 50);
    }

    if (progress.stage === STAGES.ENCODING && progress.progress !== undefined) {
      return 50 + Math.round(progress.progress * 50);
    }

    return 0;
  };

  const percent = getProgressPercent();
  const isComplete = progress.stage === STAGES.COMPLETE;
  const isError = progress.stage === STAGES.ERROR;

  return (
    <div className="export-progress">
      <div className="progress-stage">
        <span className={`stage-indicator ${isError ? 'error' : ''}`}>
          {getStageLabel(progress.stage)}
        </span>
      </div>

      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill ${isComplete ? 'complete' : ''} ${isError ? 'error' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="progress-info">
        <span className="progress-percent">{percent}%</span>
        {progress.message && (
          <span className="progress-message">{progress.message}</span>
        )}
      </div>

      {progress.exerciseIndex && progress.totalExercises && (
        <div className="progress-detail">
          {t('player.exercise')} {progress.exerciseIndex} / {progress.totalExercises}
        </div>
      )}

      {!isComplete && !isError && (
        <button className="secondary-button cancel-button" onClick={onCancel}>
          {t('export.cancel')}
        </button>
      )}
    </div>
  );
}

export default ExportProgress;
