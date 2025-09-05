import React from 'react';
import type { FC } from 'react';

type Props = {
  userName?: string;
  onRestart: () => void;
};

const ThankYouScreen: FC<Props> = ({ userName, onRestart }) => {
  return (
    <div className="thankyou-screen">
      <div className="thankyou-section">
        <h1 className="thankyou-title">
          Leading digital transformation for<br />
          mid-market companies{userName && `, ${userName}`}
        </h1>
        
        <div className="thankyou-divider">
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
        
        <p className="thankyou-description">
          We create tailored technology solutions that enhance customer experiences,<br />
          drive lasting growth, and future-proof businesses.
        </p>
        
        <button className="thankyou-cta" onClick={onRestart}>
          START OVER
        </button>
      </div>
    </div>
  );
};

export default ThankYouScreen;
