
import React, { useState } from 'react';
import './MenuPage.css';
import Bubbles from '../Bubbles/Bubbles';

// Конфигурация фонового слоя
const BACKGROUND_IMAGE = '/assets/background_prod.png';

interface MenuPageProps {
  onBackToStart: () => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onBackToStart }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  const handleVideoTrigger = () => {
    setShowVideo(true);
  };

  const handleVideoEnded = () => {
    // Показываем оверлей и начинаем плавное затухание
    setIsTransitioning(true);
    // Запускаем анимацию затухания через небольшую задержку для срабатывания transition
    setTimeout(() => {
      setFadeOpacity(1);
    }, 50);
    
    // После полного затухания переключаемся на главный экран
    setTimeout(() => {
      onBackToStart();
    }, 2000);
  };

  const handleInactivityTimeout = () => {
    // При неактивности возвращаемся на главный экран
    onBackToStart();
  };

  return (
    <div className="menu-page">
      <div
        className="menu-page__background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* interactive bubbles layer */}
      <Bubbles 
        onVideoTrigger={handleVideoTrigger}
        onInactivityTimeout={handleInactivityTimeout}
      />

      {/* Video overlay */}
      {showVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000000,
            backgroundColor: 'transparent',
          }}
        >
          <video
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onEnded={handleVideoEnded}
          >
            <source src="/assets/video.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* Fade overlay для затухания всего экрана */}
      {isTransitioning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10000000,
            backgroundColor: 'black',
            opacity: fadeOpacity,
            transition: 'opacity 1.5s ease-in-out',
          }}
        />
      )}

      <div className="menu-page__content">
        {/* Content area — heading removed as requested */}
      </div>
    </div>
  );
};

export default MenuPage;
