import { useState } from 'react';
import './App.css';
import WorkoutBuilder from './components/WorkoutBuilder/WorkoutBuilder';
import WorkoutPlayer from './components/WorkoutPlayer/WorkoutPlayer';
import { WorkoutProvider } from './contexts/WorkoutContext';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'editor', 'player'
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const handleStartWorkout = (workout) => {
    setSelectedWorkout(workout);
    setCurrentView('player');
  };

  const handleBackToEditor = () => {
    setCurrentView('editor');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="home-view">
            <h1>Fitness Workout Video Editor</h1>
            <p>Create custom follow-along workout videos</p>
            <div className="home-buttons">
              <button 
                className="primary-button"
                onClick={() => setCurrentView('editor')}
              >
                New Workout Plan
              </button>
              <button 
                className="secondary-button"
                onClick={() => alert('Coming soon: Load saved workouts')}
              >
                Open Saved Plan
              </button>
            </div>
          </div>
        );
      case 'editor':
        return (
          <WorkoutBuilder 
            onStartWorkout={handleStartWorkout}
            onBack={() => setCurrentView('home')}
          />
        );
      case 'player':
        return (
          <WorkoutPlayer 
            workout={selectedWorkout}
            onComplete={handleBackToEditor}
            onBack={handleBackToEditor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WorkoutProvider>
      <div className="app">
        {renderView()}
      </div>
    </WorkoutProvider>
  );
}

export default App;

