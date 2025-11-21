import React, { useState } from 'react';
import StartScreen from './components/StartScreen/StartScreen';
import './App.css';

type ViewType = 'start' | 'menu';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('start');

  const handleStart = () => {
    setCurrentView('menu');
  };

  return (
    <div className="app">
      {currentView === 'start' && (
        <StartScreen onStart={handleStart} />
      )}
      
      {currentView === 'menu' && (
        <div className="menu-placeholder">
          <h1>Главное меню</h1>
          <p>Здесь будет меню приложения</p>
        </div>
      )}
    </div>
  );
};

export default App;
