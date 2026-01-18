import { useState } from 'react';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useTranslation } from '../../i18n/I18nContext';
import VideoImporter from '../VideoImporter/VideoImporter';
import ExerciseEditor from '../ExerciseEditor/ExerciseEditor';
import './WorkoutBuilder.css';

function WorkoutBuilder({ onStartWorkout, onBack }) {
  const { state, dispatch, ACTIONS } = useWorkout();
  const { t } = useTranslation();
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
    if (confirm(t('exercise.confirmDelete'))) {
      dispatch({ type: ACTIONS.REMOVE_EXERCISE, payload: id });
    }
  };

  const handleStartWorkout = () => {
    if (state.exercises.length === 0) {
      alert(t('builder.needExercises'));
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

  const handleExportJSON = () => {
    try {
      // Create exportable data (without video File objects)
      const exportData = {
        version: '1.0',
        workoutName: state.workoutName,
        exercises: state.exercises,
        exportDate: new Date().toISOString(),
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.workoutName.replace(/\s+/g, '_')}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(t('builder.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      alert(t('builder.exportError'));
    }
  };

  return (
    <div className="workout-builder">
      <header className="builder-header">
        <button className="back-button" onClick={onBack}>{t('builder.back')}</button>
        <h1>{t('builder.title')}</h1>
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
          <h2>{t('builder.importVideos')}</h2>
          <VideoImporter />
        </div>

        <div className="builder-section">
          <div className="section-header">
            <h2>{t('builder.exercises')}</h2>
            <button
              className="primary-button"
              onClick={handleAddExercise}
              disabled={state.videos.length === 0}
            >
              {t('builder.addExercise')}
            </button>
          </div>

          {state.exercises.length === 0 ? (
            <div className="empty-state">
              <p>{t('builder.noExercises')}</p>
              <p className="text-secondary">
                {state.videos.length === 0
                  ? t('builder.importFirst')
                  : t('builder.clickToStart')}
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
                        {t('exercise.edit')}
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteExercise(exercise.id)}
                      >
                        {t('exercise.delete')}
                      </button>
                    </div>
                  </div>
                  <div className="exercise-details">
                    <p><strong>{t('exercise.type')}</strong> {exercise.exerciseType === 'count' ? t('exercise.countBased') : t('exercise.durationBased')}</p>
                    <p><strong>{t('exercise.video')}</strong> {exercise.videoSource.fileName} ({exercise.videoSource.startTime}s - {exercise.videoSource.endTime}s)</p>
                    {exercise.exerciseType === 'count' ? (
                      <p><strong>{t('exercise.config')}</strong> {exercise.parameters.repsPerSet} {t('exercise.reps')} × {exercise.parameters.sets} {t('exercise.sets')}</p>
                    ) : (
                      <p><strong>{t('exercise.config')}</strong> {exercise.parameters.durationSeconds}{t('exercise.seconds')} × {exercise.parameters.sets} {t('exercise.sets')}</p>
                    )}
                    <p><strong>{t('exercise.restBetweenSets')}</strong> {exercise.parameters.restBetweenSets}{t('exercise.seconds')}</p>
                    <p><strong>{t('exercise.restAfterExercise')}</strong> {exercise.restAfterExercise || 0}{t('exercise.seconds')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="builder-footer">
          <div className="workout-summary">
            <strong>{t('builder.totalExercises')}</strong> {state.exercises.length} | 
            <strong> {t('builder.estimatedDuration')}</strong> {calculateTotalDuration()}
          </div>
          <div className="footer-actions">
            <button 
              className="secondary-button" 
              onClick={handleExportJSON}
              disabled={state.exercises.length === 0}
            >
              {t('builder.exportJSON')}
            </button>
            <button
              className="primary-button"
              onClick={handleStartWorkout}
              disabled={state.exercises.length === 0}
            >
              {t('builder.startWorkout')}
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
