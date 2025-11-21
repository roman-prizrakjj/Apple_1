import React from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="start-screen">
      <div className="start-screen__background"></div>
      
      <button 
        className="start-screen__button" 
        onClick={onStart}
        onTouchStart={onStart}
      >
        <div className="start-screen__button-bg"></div>
        <span className="start-screen__button-text">Начать</span>
      </button>
    </div>
  );
};

export default StartScreen;
