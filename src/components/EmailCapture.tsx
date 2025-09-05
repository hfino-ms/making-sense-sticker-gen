import React, { useState } from 'react';

type Props = {
  onSkip: () => void;
  onSubmit: (email: string) => void;
};

const EmailCapture: React.FC<Props> = ({ onSkip, onSubmit }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim());
    } else {
      onSkip();
    }
  };

  return (
    <div className="email-capture-screen">
      <div className="email-section">
        <h1 className="email-title">Looking forward to making sense with you</h1>
        
        <div className="email-divider">
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
        
        <p className="email-description">
          Would you like to get personalized insights for your business?<br />
          Leave us your email and we'll reach out to you.
        </p>
        
        <form onSubmit={handleSubmit} className="email-form">
          <div className="email-input-wrapper">
            <input
              type="email"
              className="email-input"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button 
            type="button"
            className="hero-button"
            onClick={onSkip}
          >
            SKIP
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailCapture;
