import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen/StartScreen';
import MenuPage from './components/MenuPage/MenuPage';
import './App.css';

type ViewType = 'start' | 'menu';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('start');
  const [fadeIn, setFadeIn] = useState(true);

  // Отправляем OSC команду при смене экрана
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.sendScreenChange(currentView);
      console.log(`[App] Screen changed to: ${currentView}`);
    }
  }, [currentView]);

  const handleStart = () => {
    setCurrentView('menu');
  };

  const handleBackToStart = () => {
    setCurrentView('start');
    setFadeIn(false);
    // Триггерим появление через небольшую задержку
    setTimeout(() => setFadeIn(true), 50);
  };

  return (
    <div className="app">
      {currentView === 'start' && (
        <div
          style={{
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 1s ease-in',
            width: '100%',
            height: '100%',
          }}
        >
          <StartScreen onStart={handleStart} />
        </div>
      )}
      
      {currentView === 'menu' && (
        <MenuPage onBackToStart={handleBackToStart} />
      )}
    </div>
  );
};

export default App;
