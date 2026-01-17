import { useState } from 'react';
import { useWorkout } from '../../contexts/WorkoutContext';
import VideoImporter from '../VideoImporter/VideoImporter';
import ExerciseEditor from '../ExerciseEditor/ExerciseEditor';
import './WorkoutBuilder.css';

function WorkoutBuilder({ onStartWorkout, onBack }) {
  const { state, dispatch, ACTIONS } = useWorkout();
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  const handleAddExercise = () => {
    setEditingExercise(null);
    setShowExerciseEditor(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setShowExerciseEditor(true);
  };

  const handleSaveExercise = (exercise) => {
    if (editingExercise) {
      dispatch({
        type: ACTIONS.UPDATE_EXERCISE,
        payload: { id: editingExercise.id, updates: exercise },
      });
    } else {
      dispatch({
        type: ACTIONS.ADD_EXERCISE,
        payload: { ...exercise, id: Date.now().toString() },
      });
    }
    setShowExerciseEditor(false);
    setEditingExercise(null);
  };

  const handleDeleteExercise = (id) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      dispatch({ type: ACTIONS.REMOVE_EXERCISE, payload: id });
    }
  };

  const handleStartWorkout = () => {
    if (state.exercises.length === 0) {
      alert('Please add at least one exercise to start the workout');
      return;
    }
    onStartWorkout(state);
  };

  const calculateTotalDuration = () => {
    let total = 0;
    state.exercises.forEach(ex => {
      if (ex.exerciseType === 'count') {
        // Estimate: each rep takes ~3 seconds
        const repDuration = 3;
        total += ex.parameters.repsPerSet * repDuration * ex.parameters.sets;
        total += ex.parameters.restBetweenSets * (ex.parameters.sets - 1);
      } else {
        total += ex.parameters.durationSeconds * ex.parameters.sets;
        total += ex.parameters.restBetweenSets * (ex.parameters.sets - 1);
      }
      total += ex.restAfterExercise || 0;
    });
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="workout-builder">
      <header className="builder-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>Workout Builder</h1>
        <input
          type="text"
          value={state.workoutName}
          onChange={(e) =>
            dispatch({ type: ACTIONS.SET_WORKOUT_NAME, payload: e.target.value })
          }
          className="workout-name-input"
        />
      </header>

      <div className="builder-content">
        <div className="builder-section">
          <h2>Import Videos</h2>
          <VideoImporter />
        </div>

        <div className="builder-section">
          <div className="section-header">
            <h2>Exercises</h2>
            <button
              className="primary-button"
              onClick={handleAddExercise}
              disabled={state.videos.length === 0}
            >
              + Add Exercise
            </button>
          </div>

          {state.exercises.length === 0 ? (
            <div className="empty-state">
              <p>No exercises added yet.</p>
              <p className="text-secondary">
                {state.videos.length === 0
                  ? 'Import videos first, then add exercises.'
                  : 'Click "Add Exercise" to get started.'}
              </p>
            </div>
          ) : (
            <div className="exercise-list">
              {state.exercises.map((exercise, index) => (
                <div key={exercise.id} className="exercise-item card">
                  <div className="exercise-header">
                    <span className="exercise-number">#{index + 1}</span>
                    <h3>{exercise.exerciseName}</h3>
                    <div className="exercise-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEditExercise(exercise)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteExercise(exercise.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="exercise-details">
                    <p><strong>Type:</strong> {exercise.exerciseType === 'count' ? 'Count-based' : 'Duration-based'}</p>
                    <p><strong>Video:</strong> {exercise.videoSource.fileName} ({exercise.videoSource.startTime}s - {exercise.videoSource.endTime}s)</p>
                    {exercise.exerciseType === 'count' ? (
                      <p><strong>Config:</strong> {exercise.parameters.repsPerSet} reps × {exercise.parameters.sets} sets</p>
                    ) : (
                      <p><strong>Config:</strong> {exercise.parameters.durationSeconds}s × {exercise.parameters.sets} sets</p>
                    )}
                    <p><strong>Rest between sets:</strong> {exercise.parameters.restBetweenSets}s</p>
                    <p><strong>Rest after exercise:</strong> {exercise.restAfterExercise || 0}s</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="builder-footer">
          <div className="workout-summary">
            <strong>Total Exercises:</strong> {state.exercises.length} | 
            <strong> Estimated Duration:</strong> {calculateTotalDuration()}
          </div>
          <div className="footer-actions">
            <button className="secondary-button" onClick={() => alert('Export feature coming soon')}>
              Export JSON
            </button>
            <button
              className="primary-button"
              onClick={handleStartWorkout}
              disabled={state.exercises.length === 0}
            >
              Start Workout
            </button>
          </div>
        </div>
      </div>

      {showExerciseEditor && (
        <ExerciseEditor
          exercise={editingExercise}
          videos={state.videos}
          onSave={handleSaveExercise}
          onCancel={() => {
            setShowExerciseEditor(false);
            setEditingExercise(null);
          }}
        />
      )}
    </div>
  );
}

export default WorkoutBuilder;
