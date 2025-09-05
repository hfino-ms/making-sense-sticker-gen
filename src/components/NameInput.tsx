import React, { useState } from 'react';

type Props = {
  onContinue: (name: string) => void;
};

const NameInput: React.FC<Props> = ({ onContinue }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onContinue(name.trim());
    }
  };

  return (
    <div className="name-input-screen">
      <div className="name-section">
        <h1 className="name-title">What should I call you?</h1>
        
        <form onSubmit={handleSubmit} className="name-form">
          <div className="name-input-wrapper">
            <input
              type="text"
              className="name-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            className="hero-button"
            disabled={!name.trim()}
          >
            CONTINUE
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameInput;
