import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import './RestTimer.css';

function RestTimer({ duration, type, currentSet, totalSets, nextExercise, onComplete }) {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const audioContextRef = useRef(null);

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

  return (
    <div className="rest-timer">
      <div className="rest-content">
        <div className="rest-icon">☕</div>
        
        <h1 className="rest-title">
          {type === 'set' ? t('rest.betweenSets') : t('rest.betweenExercises')}
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
          {type === 'set' && (
            <p>{t('rest.preparingSet', { current: currentSet, total: totalSets })}</p>
          )}
          {type === 'exercise' && nextExercise && (
            <div className="next-exercise">
              <p>{t('rest.nextExercise')}</p>
              <h3>{nextExercise.exerciseName}</h3>
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
