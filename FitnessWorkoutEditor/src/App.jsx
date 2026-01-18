import { useState } from 'react';
import './App.css';
import WorkoutBuilder from './components/WorkoutBuilder/WorkoutBuilder';
import WorkoutPlayer from './components/WorkoutPlayer/WorkoutPlayer';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { I18nProvider, useTranslation } from './i18n/I18nContext';

function AppContent() {
  const { t } = useTranslation();
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
                onClick={() => alert(t('home.comingSoon'))}
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

