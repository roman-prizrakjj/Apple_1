import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen/StartScreen';
import MenuPage from './components/MenuPage/MenuPage';
import { loadConfig, getConfig } from './services/configService';
import './App.css';

type ViewType = 'start' | 'menu';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('start');
  const [fadeIn, setFadeIn] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(20000);

  // Загружаем конфиг при старте приложения
  useEffect(() => {
    loadConfig().then(() => {
      const config = getConfig();
      setInactivityTimeout(config.inactivityTimeout);
      console.log('[App] Inactivity timeout set to:', config.inactivityTimeout, 'ms');
    });
  }, []);

  // Обработчик клика на кнопку "Начать"
  const handleStart = () => {
    setCurrentView('menu');
    
    // Отправляем OSC команду при клике на "Начать"
    if (window.electronAPI) {
      window.electronAPI.sendScreenChange('menu');
      console.log('[App] User clicked Start button → sending /screen/menu');
    }
  };

  // Обработчик возврата на главный экран (по таймеру неактивности)
  const handleBackToStart = () => {
    setCurrentView('start');
    setFadeIn(false);
    
    // Отправляем OSC команду при возврате по таймеру
    if (window.electronAPI) {
      window.electronAPI.sendScreenChange('start');
      console.log('[App] Inactivity timeout → sending /screen/start');
    }
    
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
        <MenuPage 
          onBackToStart={handleBackToStart}
          inactivityTimeout={inactivityTimeout}
        />
      )}
    </div>
  );
};

export default App;
