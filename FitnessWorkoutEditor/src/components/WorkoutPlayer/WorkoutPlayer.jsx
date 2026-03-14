import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import RestTimer from '../RestTimer/RestTimer';
import './WorkoutPlayer.css';

// Early rest behavior options
const EARLY_REST_BEHAVIOR = {
  SKIP_TO_NEXT: 'skipToNext',
  RETRY_SET: 'retrySet',
  CONTINUE_PROGRESS: 'continueProgress',
};

function WorkoutPlayer({ workout, onComplete, onBack }) {
  const { t } = useTranslation();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restType, setRestType] = useState(''); // 'set', 'exercise', or 'early'
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [playCount, setPlayCount] = useState(0); // Track reps for count-based exercises
  const [durationRemaining, setDurationRemaining] = useState(0); // Track remaining time for duration-based exercises
  const [earlyRestProgress, setEarlyRestProgress] = useState(null); // Store progress when early rest triggered

  const videoRef = useRef(null);
  const durationTimerRef = useRef(null);
  const currentExercise = workout.exercises[currentExerciseIndex];

  // Check if current exercise uses an online video
  const isOnlineVideo = currentExercise?.videoSource?.videoType === 'online';

  // Get early rest behavior from workout settings or default
  const earlyRestBehavior = workout.globalSettings?.earlyRestBehavior || EARLY_REST_BEHAVIOR.SKIP_TO_NEXT;

  // Set video start time when exercise changes
  useEffect(() => {
    if (isOnlineVideo) {
      // For online videos, just initialize duration timer if needed
      if (currentExercise && !isResting && currentExercise.exerciseType === 'duration') {
        setDurationRemaining(currentExercise.parameters.durationSeconds);
      }
      return;
    }

    if (videoRef.current && currentExercise && !isResting) {
      const video = videoRef.current;
      video.currentTime = currentExercise.videoSource.startTime;
      video.play().catch(err => console.log('Autoplay prevented:', err));

      // Initialize duration timer for duration-based exercises
      if (currentExercise.exerciseType === 'duration') {
        setDurationRemaining(currentExercise.parameters.durationSeconds);
      }
    }
  }, [currentExerciseIndex, currentSet, isResting, currentExercise, isOnlineVideo]);

  // Duration timer for duration-based exercises
  useEffect(() => {
    if (!currentExercise || currentExercise.exerciseType !== 'duration' || isResting || isPaused) {
      // Clear timer when not needed
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      return;
    }

    // Start countdown timer
    durationTimerRef.current = setInterval(() => {
      setDurationRemaining(prev => {
        if (prev <= 1) {
          // Time's up - complete the set
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
          if (videoRef.current) {
            videoRef.current.pause();
          }
          // Use setTimeout to avoid state update during render
          setTimeout(() => completeCurrentSet(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [currentExercise, isResting, isPaused, currentSet, currentExerciseIndex]);

  // Handle video clip looping and progression
  useEffect(() => {
    if (isOnlineVideo) return; // Online videos use iframe, no programmatic control

    const video = videoRef.current;
    if (!video || !currentExercise || isResting) return;

    const handleTimeUpdate = () => {
      const { startTime, endTime } = currentExercise.videoSource;

      // Check if we've reached the end of the clip
      if (video.currentTime >= endTime) {
        if (currentExercise.exerciseType === 'count') {
          // Count-based: loop video for each rep
          const newPlayCount = playCount + 1;
          if (newPlayCount < currentExercise.parameters.repsPerSet) {
            video.currentTime = startTime;
            setPlayCount(newPlayCount);
            setCurrentRep(newPlayCount + 1);
          } else {
            // Completed all reps in this set
            video.pause();
            completeCurrentSet();
          }
        } else {
          // Duration-based: loop video until timer runs out
          // Just loop back to start - the duration timer handles completion
          video.currentTime = startTime;
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentExercise, playCount, isResting, currentSet]);

  // Reset play count when changing sets or exercises
  useEffect(() => {
    setPlayCount(0);
    setCurrentRep(1);
  }, [currentSet, currentExerciseIndex]);

  const completeCurrentSet = () => {
    if (currentSet < currentExercise.parameters.sets) {
      // More sets to do - start rest timer
      setRestTimeRemaining(currentExercise.parameters.restBetweenSets);
      setRestType('set');
      setIsResting(true);
      setCurrentSet(currentSet + 1);
    } else if (currentExerciseIndex < workout.exercises.length - 1) {
      // Exercise complete, rest before next exercise
      const restTime = currentExercise.restAfterExercise || 0;
      if (restTime > 0) {
        setRestTimeRemaining(restTime);
        setRestType('exercise');
        setIsResting(true);
      } else {
        handleNext();
      }
    } else {
      // Workout complete
      setIsCompleted(true);
    }
  };

  const handleNext = () => {
    // Move to next exercise or complete workout
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setPlayCount(0);
      setIsResting(false);
      setEarlyRestProgress(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleSkip = () => {
    if (isResting) {
      setIsResting(false);
      setRestTimeRemaining(0);
      if (restType === 'exercise') {
        handleNext();
      }
    } else {
      // Skip current exercise
      if (currentExerciseIndex < workout.exercises.length - 1) {
        const restTime = currentExercise.restAfterExercise || 0;
        if (restTime > 0) {
          setRestTimeRemaining(restTime);
          setRestType('exercise');
          setIsResting(true);
        } else {
          handleNext();
        }
      } else {
        setIsCompleted(true);
      }
    }
  };

  // Handle "Need Rest" button click
  const handleNeedRest = () => {
    if (!isOnlineVideo && videoRef.current) {
      videoRef.current.pause();
    }

    // Clear duration timer if running
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Store current progress for potential continuation
    setEarlyRestProgress({
      rep: currentRep,
      playCount: playCount,
      durationRemaining: durationRemaining, // Save duration progress too
    });

    // Start rest timer using configured rest between sets time
    setRestTimeRemaining(currentExercise.parameters.restBetweenSets);
    setRestType('early');
    setIsResting(true);
    setIsPaused(false);
  };

  // Handle rest completion based on early rest behavior
  const handleRestComplete = () => {
    setIsResting(false);

    if (restType === 'exercise') {
      handleNext();
      return;
    }

    if (restType === 'early') {
      // Handle early rest completion based on configured behavior
      switch (earlyRestBehavior) {
        case EARLY_REST_BEHAVIOR.SKIP_TO_NEXT:
          // Move to next set or next exercise
          if (currentSet < currentExercise.parameters.sets) {
            setCurrentSet(currentSet + 1);
            setPlayCount(0);
            setCurrentRep(1);
          } else if (currentExerciseIndex < workout.exercises.length - 1) {
            handleNext();
          } else {
            setIsCompleted(true);
          }
          break;

        case EARLY_REST_BEHAVIOR.RETRY_SET:
          // Restart current set from beginning
          setPlayCount(0);
          setCurrentRep(1);
          // Reset duration for duration-based exercises
          if (currentExercise.exerciseType === 'duration') {
            setDurationRemaining(currentExercise.parameters.durationSeconds);
          }
          break;

        case EARLY_REST_BEHAVIOR.CONTINUE_PROGRESS:
          // Continue from where we stopped (restore progress)
          if (earlyRestProgress) {
            setPlayCount(earlyRestProgress.playCount);
            setCurrentRep(earlyRestProgress.rep);
            // Restore duration for duration-based exercises
            if (earlyRestProgress.durationRemaining !== undefined) {
              setDurationRemaining(earlyRestProgress.durationRemaining);
            }
          }
          break;

        default:
          // Default to skip to next
          if (currentSet < currentExercise.parameters.sets) {
            setCurrentSet(currentSet + 1);
          }
      }
      setEarlyRestProgress(null);
    }
    // For 'set' type, the set counter was already incremented before resting
  };

  const handleTogglePause = () => {
    if (!isOnlineVideo && videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  };

  if (isCompleted) {
    return (
      <div className="workout-player">
        <div className="completion-screen">
          <h1>🎉 {t('player.workoutComplete')}</h1>
          <p>{t('player.completedMessage').replace('{count}', workout.exercises.length)}</p>
          <div className="completion-actions">
            <button className="primary-button" onClick={onComplete}>
              {t('player.backToEditor')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return <div>{t('player.loading')}</div>;
  }

  // Get next exercise for rest timer preview
  const getNextExerciseForPreview = () => {
    if (restType === 'exercise') {
      return workout.exercises[currentExerciseIndex + 1];
    }
    // For set rest, preview current exercise (same exercise continues)
    return currentExercise;
  };

  return (
    <div className="workout-player">
      <header className="player-header">
        <button className="back-button" onClick={onBack}>{t('player.exit')}</button>
        <h2>{workout.workoutName}</h2>
        <div className="player-progress">
          {t('player.exercise')} {currentExerciseIndex + 1} / {workout.exercises.length}
        </div>
      </header>

      {isResting ? (
        <RestTimer
          duration={restTimeRemaining}
          type={restType}
          currentSet={currentSet}
          totalSets={currentExercise.parameters.sets}
          nextExercise={getNextExerciseForPreview()}
          onComplete={handleRestComplete}
        />
      ) : (
        <div className="exercise-view">
          <div className="video-container">
            {isOnlineVideo ? (
              currentExercise.videoSource.embedUrl ? (
                <iframe
                  src={currentExercise.videoSource.embedUrl}
                  className="exercise-video exercise-iframe"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  title={currentExercise.exerciseName}
                />
              ) : (
                <div className="online-video-fallback">
                  <a
                    href={currentExercise.videoSource.originalUrl || currentExercise.videoSource.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-video-link"
                  >
                    {t('player.openInBrowser')}
                  </a>
                </div>
              )
            ) : (
              <video
                ref={videoRef}
                src={currentExercise.videoSource.videoUrl}
                className="exercise-video"
              />
            )}
          </div>

          <div className="exercise-info">
            <h1>{currentExercise.exerciseName}</h1>

            <div className="exercise-stats">
              {currentExercise.exerciseType === 'count' ? (
                <div className="stat">
                  <span className="stat-label">{t('player.reps')}</span>
                  <span className="stat-value">
                    {currentRep} / {currentExercise.parameters.repsPerSet}
                  </span>
                </div>
              ) : (
                <div className="stat">
                  <span className="stat-label">{t('player.duration')}</span>
                  <span className="stat-value">
                    {durationRemaining}{t('exercise.seconds')}
                  </span>
                </div>
              )}

              <div className="stat">
                <span className="stat-label">{t('player.set')}</span>
                <span className="stat-value">{currentSet} / {currentExercise.parameters.sets}</span>
              </div>
            </div>

            <div className="exercise-instructions">
              <p>
                {currentExercise.exerciseType === 'count'
                  ? t('player.performReps').replace('{count}', currentExercise.parameters.repsPerSet)
                  : t('player.holdFor').replace('{seconds}', currentExercise.parameters.durationSeconds)}
              </p>
            </div>
          </div>

          <div className="player-controls">
            <button
              className="control-button"
              onClick={handleTogglePause}
            >
              {isPaused ? t('player.resume') : t('player.pause')}
            </button>
            {isOnlineVideo && currentExercise.exerciseType === 'count' && (
              <button
                className="control-button primary"
                onClick={completeCurrentSet}
              >
                {t('player.completeSet')}
              </button>
            )}
            <button
              className="control-button"
              onClick={handleSkip}
            >
              {t('player.skip')}
            </button>
            <button
              className="control-button need-rest-button"
              onClick={handleNeedRest}
            >
              {t('player.needRest')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutPlayer;
