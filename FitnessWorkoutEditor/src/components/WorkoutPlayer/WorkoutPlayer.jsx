import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import RestTimer from '../RestTimer/RestTimer';
import './WorkoutPlayer.css';

function WorkoutPlayer({ workout, onComplete, onBack }) {
  const { t } = useTranslation();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restType, setRestType] = useState(''); // 'set' or 'exercise'
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [playCount, setPlayCount] = useState(0); // Track reps for count-based exercises
  
  const videoRef = useRef(null);
  const currentExercise = workout.exercises[currentExerciseIndex];

  // Set video start time when exercise changes
  useEffect(() => {
    if (videoRef.current && currentExercise && !isResting) {
      const video = videoRef.current;
      video.currentTime = currentExercise.videoSource.startTime;
      video.play().catch(err => console.log('Autoplay prevented:', err));
    }
  }, [currentExerciseIndex, currentSet, isResting, currentExercise]);

  // Handle video clip looping and progression
  useEffect(() => {
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
          // Duration-based: stop after one play
          video.pause();
          completeCurrentSet();
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
          nextExercise={restType === 'exercise' ? workout.exercises[currentExerciseIndex + 1] : null}
          onComplete={() => {
            setIsResting(false);
            if (restType === 'exercise') {
              handleNext();
            }
          }}
        />
      ) : (
        <div className="exercise-view">
          <div className="video-container">
            <video
              ref={videoRef}
              src={currentExercise.videoSource.videoUrl}
              className="exercise-video"
            />
          </div>

          <div className="exercise-info">
            <h1>{currentExercise.exerciseName}</h1>
            
            <div className="exercise-stats">
              <div className="stat">
                <span className="stat-label">{t('player.set')}</span>
                <span className="stat-value">{currentSet} / {currentExercise.parameters.sets}</span>
              </div>
              
              {currentExercise.exerciseType === 'count' ? (
                <div className="stat">
                  <span className="stat-label">{t('player.reps')}</span>
                  <span className="stat-value">{currentRep} / {currentExercise.parameters.repsPerSet}</span>
                </div>
              ) : (
                <div className="stat">
                  <span className="stat-label">{t('player.duration')}</span>
                  <span className="stat-value">{currentExercise.parameters.durationSeconds}{t('exercise.seconds')}</span>
                </div>
              )}
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
              onClick={() => {
                if (videoRef.current) {
                  if (isPaused) {
                    videoRef.current.play();
                  } else {
                    videoRef.current.pause();
                  }
                  setIsPaused(!isPaused);
                }
              }}
            >
              {isPaused ? t('player.resume') : t('player.pause')}
            </button>
            <button className="control-button" onClick={handleSkip}>
              {t('player.skip')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutPlayer;
