import { useState, useEffect } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const DialQuestion = ({ value, onChange }: Props) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Convert percentage to angle (0% = -90deg, 100% = 180deg)
  const angle = -90 + (localValue / 100) * 270;

  return (
    <div className="dial-container">
      <div className="dial-wrapper">
        {/* Background circle with gradient */}
        <div className="dial-background">
          <svg width="330" height="327" viewBox="0 0 330 327" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.1">
              <path d="M167 23.5C198.439 23.5 228.962 34.0817 253.654 53.5409C278.347 73.0001 295.771 100.204 303.121 130.771C310.47 161.339 307.317 193.49 294.17 222.048C281.022 250.605 258.646 273.906 230.643 288.198C202.641 302.49 170.644 306.94 139.804 300.833C108.964 294.726 81.0779 278.416 60.6359 254.531C40.1939 230.646 28.3862 200.575 27.1146 169.163C25.843 137.75 35.1814 106.823 53.6259 81.364L72.7994 95.2546C57.4742 116.408 49.715 142.105 50.7716 168.205C51.8281 194.305 61.6389 219.29 78.6238 239.136C95.6088 258.982 118.779 272.533 144.403 277.608C170.027 282.682 196.614 278.984 219.88 267.109C243.147 255.234 261.739 235.874 272.663 212.146C283.587 188.418 286.207 161.704 280.1 136.306C273.994 110.908 259.516 88.3052 239 72.1369C218.483 55.9685 193.122 47.1764 167 47.1764V23.5Z" fill="url(#paint0_linear)"/>
            </g>
            <circle cx="167" cy="163.5" r="129.559" stroke="white"/>
            <circle cx="167" cy="163.5" r="115.976" fill="#F9F9F9" filter="drop-shadow(0 0 43.2px rgba(0,0,0,0.1))"/>
            <defs>
              <linearGradient id="paint0_linear" x1="27" y1="163.5" x2="307" y2="163.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ECC7E"/>
                <stop offset="1" stopColor="#53C0D2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Center content */}
        <div className="dial-center">
          <div className="dial-percentage">{Math.round(localValue)}%</div>
          <div className="dial-label">
            <div>RISK</div>
            <div>TOLERANCE</div>
          </div>
        </div>

        {/* Draggable handle */}
        <div 
          className="dial-handle"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="dial-handle-dot"></div>
        </div>

        {/* Invisible input for accessibility and easier interaction */}
        <input
          type="range"
          min="0"
          max="100"
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="dial-input"
          aria-label="Risk tolerance percentage"
        />
      </div>
      {/* Linear slider control below the dial for precise adjustments */}
      <div className="dial-linear-control">
        <input
          type="range"
          min={0}
          max={100}
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="dial-linear"
          aria-label="Adjust intensity"
        />
      </div>
    </div>
  );
};

export default DialQuestion;
