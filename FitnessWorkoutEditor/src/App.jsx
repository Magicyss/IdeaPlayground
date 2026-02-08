import { useState } from 'react';
import './App.css';
import WorkoutBuilder from './components/WorkoutBuilder/WorkoutBuilder';
import WorkoutPlayer from './components/WorkoutPlayer/WorkoutPlayer';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import { WorkoutProvider, useWorkout } from './contexts/WorkoutContext';
import { I18nProvider, useTranslation } from './i18n/I18nContext';

function AppContent() {
  const { t } = useTranslation();
  const { dispatch, ACTIONS } = useWorkout();
  const [currentView, setCurrentView] = useState('home'); // 'home', 'editor', 'player'
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const handleStartWorkout = (workout) => {
    setSelectedWorkout(workout);
    setCurrentView('player');
  };

  const handleBackToEditor = () => {
    setCurrentView('editor');
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate the imported data
        if (!data.exercises || !Array.isArray(data.exercises)) {
          throw new Error('Invalid workout plan format');
        }

        // Dispatch import action to load the workout data
        dispatch({ type: ACTIONS.IMPORT_WORKOUT, payload: data });
        alert(t('home.importSuccess'));
        setCurrentView('editor');
      } catch (error) {
        console.error('Import error:', error);
        alert(t('home.importError'));
      }
    };
    input.click();
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="home-view">
            <h1>{t('app.title')}</h1>
            <p>{t('app.subtitle')}</p>
            <div className="home-buttons">
              <button 
                className="primary-button"
                onClick={() => setCurrentView('editor')}
              >
                {t('home.newPlan')}
              </button>
              <button 
                className="secondary-button"
                onClick={handleImportJSON}
              >
                {t('home.openPlan')}
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
    <div className="app">
      <LanguageSwitcher />
      {renderView()}
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <WorkoutProvider>
        <AppContent />
      </WorkoutProvider>
    </I18nProvider>
  );
}

export default App;

