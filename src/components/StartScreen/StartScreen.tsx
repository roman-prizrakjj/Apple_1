import React from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  // Звуки кнопки
  const soundFiles = [
    '/assets/bubble-pop-v2.wav',
    '/assets/bubble-pop-v3.wav',
    '/assets/bubble-pop-v4.wav'
  ];

  const handleButtonClick = () => {
    // Воспроизведение случайного звука
    try {
      const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
      const audio = new Audio(randomSound);
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (e) {
      // ignore
    }
    
    // Вызываем колбэк
    onStart();
  };

  return (
    <div className="start-screen">
      <div className="start-screen__background"></div>
      
      <button 
        className="start-screen__button" 
        onClick={handleButtonClick}
        onTouchStart={handleButtonClick}
      >
        <div className="start-screen__button-bg"></div>
        <span className="start-screen__button-text">Начать</span>
      </button>
    </div>
  );
};

export default StartScreen;
