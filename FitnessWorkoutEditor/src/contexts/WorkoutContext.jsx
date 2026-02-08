import { createContext, useContext, useReducer, useEffect } from 'react';

const WorkoutContext = createContext();

// Action types
const ACTIONS = {
  SET_VIDEOS: 'SET_VIDEOS',
  ADD_VIDEO: 'ADD_VIDEO',
  REMOVE_VIDEO: 'REMOVE_VIDEO',
  SET_EXERCISES: 'SET_EXERCISES',
  ADD_EXERCISE: 'ADD_EXERCISE',
  UPDATE_EXERCISE: 'UPDATE_EXERCISE',
  REMOVE_EXERCISE: 'REMOVE_EXERCISE',
  REORDER_EXERCISES: 'REORDER_EXERCISES',
  SET_WORKOUT_NAME: 'SET_WORKOUT_NAME',
  LOAD_WORKOUT: 'LOAD_WORKOUT',
  CLEAR_WORKOUT: 'CLEAR_WORKOUT',
  IMPORT_WORKOUT: 'IMPORT_WORKOUT',
  LINK_VIDEO_TO_EXERCISES: 'LINK_VIDEO_TO_EXERCISES',
};

// Initial state
const initialState = {
  workoutName: 'My Workout Plan',
  videos: [], // { id, type: 'local'|'online', file?, fileName, url, duration, platform?, videoId?, embedUrl? }
  exercises: [], // Exercise objects
};

// Reducer
function workoutReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_VIDEOS:
      return { ...state, videos: action.payload };
    
    case ACTIONS.ADD_VIDEO:
      return { ...state, videos: [...state.videos, action.payload] };
    
    case ACTIONS.REMOVE_VIDEO:
      return {
        ...state,
        videos: state.videos.filter(v => v.id !== action.payload),
      };
    
    case ACTIONS.SET_EXERCISES:
      return { ...state, exercises: action.payload };
    
    case ACTIONS.ADD_EXERCISE:
      return { ...state, exercises: [...state.exercises, action.payload] };
    
    case ACTIONS.UPDATE_EXERCISE:
      return {
        ...state,
        exercises: state.exercises.map(ex =>
          ex.id === action.payload.id ? { ...ex, ...action.payload.updates } : ex
        ),
      };
    
    case ACTIONS.REMOVE_EXERCISE:
      return {
        ...state,
        exercises: state.exercises.filter(ex => ex.id !== action.payload),
      };
    
    case ACTIONS.REORDER_EXERCISES:
      return { ...state, exercises: action.payload };
    
    case ACTIONS.SET_WORKOUT_NAME:
      return { ...state, workoutName: action.payload };
    
    case ACTIONS.LOAD_WORKOUT:
      return { ...state, ...action.payload };

    case ACTIONS.IMPORT_WORKOUT:
      // Import workout: load exercises and workoutName, keep videos empty (need re-import)
      return {
        ...initialState,
        workoutName: action.payload.workoutName || initialState.workoutName,
        exercises: action.payload.exercises || [],
      };

    case ACTIONS.CLEAR_WORKOUT:
      return initialState;

    case ACTIONS.LINK_VIDEO_TO_EXERCISES:
      // Update exercises that match the video by filename
      // payload: { videoId, videoUrl, fileName }
      return {
        ...state,
        exercises: state.exercises.map(ex => {
          if (ex.videoSource?.fileName === action.payload.fileName) {
            return {
              ...ex,
              videoSource: {
                ...ex.videoSource,
                videoId: action.payload.videoId,
                videoUrl: action.payload.videoUrl,
              },
            };
          }
          return ex;
        }),
      };

    default:
      return state;
  }
}

// Provider component
export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  // Load saved draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('workoutDraft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        dispatch({ type: ACTIONS.LOAD_WORKOUT, payload: draft });
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    try {
      const draftData = {
        workoutName: state.workoutName,
        exercises: state.exercises,
        // Don't save video files, only references
      };
      localStorage.setItem('workoutDraft', JSON.stringify(draftData));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [state.workoutName, state.exercises]);

  const value = {
    state,
    dispatch,
    ACTIONS,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Custom hook to use the workout context
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
