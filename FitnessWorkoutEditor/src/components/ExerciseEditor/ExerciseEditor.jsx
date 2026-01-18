import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import ClipSelector from '../ClipSelector/ClipSelector';
import './ExerciseEditor.css';

function ExerciseEditor({ exercise, videos, onSave, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    exerciseName: '',
    exerciseType: 'count', // 'count' or 'duration'
    videoSource: null,
    parameters: {
      repsPerSet: 15,
      sets: 3,
      restBetweenSets: 30,
      durationSeconds: 30,
    },
    restAfterExercise: 15,
  });

  const [showClipSelector, setShowClipSelector] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (exercise) {
      setFormData(exercise);
      if (exercise.videoSource) {
        const video = videos.find(v => v.id === exercise.videoSource.videoId);
        setSelectedVideo(video);
      }
    }
  }, [exercise, videos]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleParameterChange = (param, value) => {
    setFormData(prev => ({
      ...prev,
      parameters: { ...prev.parameters, [param]: parseInt(value) || 0 },
    }));
  };

  const handleSelectClip = (clipData) => {
    setFormData(prev => ({
      ...prev,
      videoSource: clipData,
    }));
    setShowClipSelector(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.exerciseName.trim()) {
      alert('Please enter an exercise name');
      return;
    }
    
    if (!formData.videoSource) {
      alert('Please select a video clip');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="exercise-editor-overlay">
      <div className="exercise-editor card">
        <div className="editor-header">
          <h2>{exercise ? 'Edit Exercise' : 'Add Exercise'}</h2>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          <div className="form-group">
            <label>Exercise Name*</label>
            <input
              type="text"
              value={formData.exerciseName}
              onChange={(e) => handleChange('exerciseName', e.target.value)}
              placeholder="e.g., Squats, Wall Sit"
              required
            />
          </div>

          <div className="form-group">
            <label>Exercise Type*</label>
            <select
              value={formData.exerciseType}
              onChange={(e) => handleChange('exerciseType', e.target.value)}
            >
              <option value="count">Count-based (reps)</option>
              <option value="duration">Duration-based (time)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Video Clip*</label>
            {formData.videoSource ? (
              <div className="selected-clip">
                <p>
                  <strong>{formData.videoSource.fileName}</strong>
                  <br />
                  {formData.videoSource.startTime}s - {formData.videoSource.endTime}s
                  ({formData.videoSource.endTime - formData.videoSource.startTime}s duration)
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowClipSelector(true)}
                >
                  Change Clip
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowClipSelector(true)}
              >
                Select Video Clip
              </button>
            )}
          </div>

          {formData.exerciseType === 'count' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Reps per Set</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.parameters.repsPerSet}
                    onChange={(e) => handleParameterChange('repsPerSet', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Number of Sets</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.parameters.sets}
                    onChange={(e) => handleParameterChange('sets', e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.parameters.durationSeconds}
                    onChange={(e) => handleParameterChange('durationSeconds', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Number of Sets</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.parameters.sets}
                    onChange={(e) => handleParameterChange('sets', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Rest Between Sets (seconds)</label>
              <input
                type="number"
                min="0"
                value={formData.parameters.restBetweenSets}
                onChange={(e) => handleParameterChange('restBetweenSets', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Rest After Exercise (seconds)</label>
              <input
                type="number"
                min="0"
                value={formData.restAfterExercise}
                onChange={(e) => handleChange('restAfterExercise', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save Exercise
            </button>
          </div>
        </form>

        {showClipSelector && (
          <ClipSelector
            videos={videos}
            onSelectClip={handleSelectClip}
            onCancel={() => setShowClipSelector(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ExerciseEditor;
