import React, { useState } from 'react';
import StartScreen from './components/StartScreen/StartScreen';
import MenuPage from './components/MenuPage/MenuPage';
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
        <MenuPage />
      )}
    </div>
  );
};

export default App;
