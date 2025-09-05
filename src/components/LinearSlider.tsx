import { useState, useEffect } from 'react';
import type { FC } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const LinearSlider: FC<Props> = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(Number(e.target.value));
  };

  return (
    <div className="linear-slider-container">
      <div className="linear-slider-result">
        <div className="linear-slider-percentage">{Math.round(localValue)}%</div>
        <div className="linear-slider-label">RISK TOLERANCE</div>
      </div>
      
      <div className="linear-slider-controls">
        <div className="linear-slider-track-container">
          <div className="linear-slider-track-bg"></div>
          <div className="linear-slider-track-white"></div>
          <div 
            className="linear-slider-track-filled"
            style={{ width: `${(localValue / 100) * 100}%` }}
          ></div>
          <div 
            className="linear-slider-thumb"
            style={{ left: `${(localValue / 100) * 100}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max="100"
            value={localValue}
            onChange={handleInputChange}
            className="linear-slider-input"
            aria-label="Risk tolerance percentage"
          />
        </div>
        
        <div className="linear-slider-labels">
          <span className="linear-slider-label-text">LOW</span>
          <span className="linear-slider-label-text">MEDIUM</span>
          <span className="linear-slider-label-text">HIGH</span>
        </div>
      </div>
    </div>
  );
};

export default LinearSlider;
