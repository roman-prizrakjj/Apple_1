
import React from 'react';
import './MenuPage.css';
import Bubbles from '../Bubbles/Bubbles';

// Конфигурация фоновых слоев
const BACKGROUND_IMAGES = {
  BACKGROUND: '/assets/background_prod.png',
  FOREGROUND: '/assets/product-foreground.png',
};

const MenuPage: React.FC = () => {
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
          backgroundImage: `url(${BACKGROUND_IMAGES.BACKGROUND})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Foreground product image (full-width, above background, below UI content) */}
      <div className="menu-page__foreground" aria-hidden="true">
        <img
          src={BACKGROUND_IMAGES.FOREGROUND}
          alt=""
          className="menu-page__foreground-img"
        />
      </div>

      {/* interactive bubbles layer */}
      <Bubbles />

      <div className="menu-page__content">
        {/* Content area — heading removed as requested */}
      </div>
    </div>
  );
};

export default MenuPage;
