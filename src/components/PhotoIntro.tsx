import React from 'react';

type Props = {
  onOpenCamera: () => void;
  onSkip: () => void;
};

const PhotoIntro: React.FC<Props> = ({ onOpenCamera, onSkip }) => {
  return (
    <div className="photo-intro-screen">
      <div className="photo-intro-section">
        <h1 className="photo-intro-title">
          Go beyond and<br />
          personalize your robot
        </h1>
        
        <div className="photo-intro-divider">
          <div className="divider-line"></div>
          <svg width="5" height="4" viewBox="0 0 5 4" fill="none" xmlns="http://www.w3.org/2000/svg" className="divider-dot">
            <circle cx="2.5" cy="2" r="2" fill="url(#paint0_linear)"/>
            <defs>
              <linearGradient id="paint0_linear" x1="0.688744" y1="1.47298" x2="2.12203" y2="3.02577" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1EDD8E"/>
                <stop offset="1" stopColor="#53C0D2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <p className="photo-intro-description">
          Take a selfie to customize your robot's features to match your unique style.
        </p>
        
        <div className="photo-intro-buttons">
          <button 
            className="nav-button secondary"
            onClick={onSkip}
          >
            SKIP
          </button>
          
          <button 
            className="nav-button primary"
            onClick={onOpenCamera}
          >
            OPEN CAMERA
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoIntro;
