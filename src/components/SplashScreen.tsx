import React from 'react';

type Props = { onStart: () => void };

const SplashScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="welcome-screen">
      <div className="hero-section">
        <h1 className="hero-title">
          Use our AI-powered tool to pinpoint your unique tech attitude
        </h1>
        
        <div className="hero-divider">
          <div className="divider-line"></div>
          <div className="divider-dot"></div>
        </div>
        
        <p className="hero-description">
          Find out if you're a the Visionary, the Strategist,<br />
          the Innovator, the Connector or the Trailblazer.
        </p>
        
        <button className="hero-button" onClick={onStart}>
          LET'S START
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
