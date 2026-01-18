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
  
  const videoRef = useRef(null);
  const currentExercise = workout.exercises[currentExerciseIndex];

  // This is a simplified player - full implementation would handle video playback timing
  // and automatic progression through exercises

  const handleNext = () => {
    // Move to next exercise or complete workout
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setIsResting(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleSkip = () => {
    if (isResting) {
      setIsResting(false);
      setRestTimeRemaining(0);
    } else {
      handleNext();
    }
  };

  if (isCompleted) {
    return (
      <div className="workout-player">
        <div className="completion-screen">
          <h1>🎉 Workout Complete!</h1>
          <p>Great job! You completed {workout.exercises.length} exercises.</p>
          <div className="completion-actions">
            <button className="primary-button" onClick={onComplete}>
              Back to Editor
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return <div>Loading...</div>;
  }

  return (
    <div className="workout-player">
      <header className="player-header">
        <button className="back-button" onClick={onBack}>← Exit</button>
        <h2>{workout.workoutName}</h2>
        <div className="player-progress">
          Exercise {currentExerciseIndex + 1} / {workout.exercises.length}
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
              controls
              autoPlay
              className="exercise-video"
            />
          </div>

          <div className="exercise-info">
            <h1>{currentExercise.exerciseName}</h1>
            
            <div className="exercise-stats">
              <div className="stat">
                <span className="stat-label">Set</span>
                <span className="stat-value">{currentSet} / {currentExercise.parameters.sets}</span>
              </div>
              
              {currentExercise.exerciseType === 'count' ? (
                <div className="stat">
                  <span className="stat-label">Reps</span>
                  <span className="stat-value">{currentRep} / {currentExercise.parameters.repsPerSet}</span>
                </div>
              ) : (
                <div className="stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{currentExercise.parameters.durationSeconds}s</span>
                </div>
              )}
            </div>

            <div className="exercise-instructions">
              <p>
                {currentExercise.exerciseType === 'count'
                  ? `Perform ${currentExercise.parameters.repsPerSet} repetitions`
                  : `Hold for ${currentExercise.parameters.durationSeconds} seconds`}
              </p>
            </div>
          </div>

          <div className="player-controls">
            <button
              className="control-button"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button className="control-button" onClick={handleSkip}>
              ⏭️ Skip
            </button>
            <button
              className="control-button primary"
              onClick={() => {
                // Simulate completing current set
                if (currentSet < currentExercise.parameters.sets) {
                  setRestTimeRemaining(currentExercise.parameters.restBetweenSets);
                  setRestType('set');
                  setIsResting(true);
                  setCurrentSet(currentSet + 1);
                } else if (currentExerciseIndex < workout.exercises.length - 1) {
                  setRestTimeRemaining(currentExercise.restAfterExercise || 0);
                  setRestType('exercise');
                  setIsResting(true);
                } else {
                  setIsCompleted(true);
                }
              }}
            >
              ✓ Complete Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutPlayer;
