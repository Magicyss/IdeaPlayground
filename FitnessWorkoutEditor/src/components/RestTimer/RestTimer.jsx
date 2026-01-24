import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import './RestTimer.css';

function RestTimer({ duration, type, currentSet, totalSets, nextExercise, onComplete }) {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const audioContextRef = useRef(null);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    setTimeRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    // Play beep sound in last 5 seconds
    if (timeRemaining <= 5 && timeRemaining > 0) {
      playBeep(timeRemaining <= 3 ? 800 : 600); // Higher pitch for last 3 seconds
    }

    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, onComplete]);

  // Setup preview video looping
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video || !nextExercise) return;

    const { startTime, endTime } = nextExercise.videoSource;

    const handleTimeUpdate = () => {
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
    };

    const handleLoadedMetadata = () => {
      video.currentTime = startTime;
      video.play().catch(err => console.log('Preview autoplay prevented:', err));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // If video is already loaded, start playing
    if (video.readyState >= 2) {
      video.currentTime = startTime;
      video.play().catch(err => console.log('Preview autoplay prevented:', err));
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [nextExercise]);

  const playBeep = (frequency = 600) => {
    try {
      // Create Web Audio API beep
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((duration - timeRemaining) / duration) * 100;

  // Get exercise details text
  const getExerciseDetails = (exercise) => {
    if (!exercise) return '';
    if (exercise.exerciseType === 'count') {
      return t('rest.nextExerciseDetails')
        .replace('{reps}', exercise.parameters.repsPerSet)
        .replace('{sets}', exercise.parameters.sets);
    }
    return t('rest.nextExerciseDuration')
      .replace('{duration}', exercise.parameters.durationSeconds)
      .replace('{sets}', exercise.parameters.sets);
  };

  return (
    <div className="rest-timer">
      <div className="rest-content">
        <div className="rest-icon">☕</div>

        <h1 className="rest-title">
          {type === 'set' || type === 'early' ? t('rest.betweenSets') : t('rest.betweenExercises')}
        </h1>

        <div className="countdown-display">
          {formatTime(timeRemaining)}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="rest-info">
          {(type === 'set' || type === 'early') && (
            <p>{t('rest.preparingSet', { current: currentSet, total: totalSets })}</p>
          )}

          {/* Video preview for next exercise */}
          {nextExercise && nextExercise.videoSource && (
            <div className="next-exercise-preview">
              <p className="preview-label">{t('rest.nextExercise')}</p>
              <video
                ref={previewVideoRef}
                src={nextExercise.videoSource.videoUrl}
                className="preview-video"
                muted
                playsInline
              />
              <h3>{nextExercise.exerciseName}</h3>
              <p className="preview-details">{getExerciseDetails(nextExercise)}</p>
            </div>
          )}
        </div>

        <button
          className="skip-rest-button"
          onClick={onComplete}
        >
          {t('rest.skip')}
        </button>
      </div>
    </div>
  );
}

export default RestTimer;
