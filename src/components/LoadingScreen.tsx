import type { FC } from 'react';

type Props = { message?: string };

const LoadingScreen: FC<Props> = ({ message }) => {
  return (
    <div className="loading-screen">
      <div className="loading-section">
        <h1 className="loading-title">We're processing your data</h1>
        
        <div className="loading-divider">
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
        
        <p className="loading-description">
          {message ?? "Our AI-powered tool is creating your tailored robot now.\nIt's only a matter of seconds."}
        </p>
        
        <div className="loading-spinner">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle 
              cx="28" 
              cy="28" 
              r="23.8" 
              stroke="url(#spinnerGradient)" 
              strokeWidth="8.4" 
              strokeLinecap="round"
              fill="none"
              className="spinner-circle"
            />
            <defs>
              <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ECC7E" stopOpacity="1"/>
                <stop offset="100%" stopColor="#53C0D2" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
