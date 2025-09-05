import type { FC } from 'react';
import type { Question } from '../types';
import Stepper from './Stepper';
import LinearSlider from './LinearSlider';

import RadioListQuestion from './RadioListQuestion';

type Props = {
  question: Question;
  selected?: { choice: string; intensity?: number };
  onSelect: (optionId: string, intensity?: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  step: number;
  total: number;
};

const QuestionScreen: FC<Props> = ({
  question,
  selected,
  onSelect,
  onNext,
  onPrevious,
  onClose,
  step,
  total
}) => {
  const handleOptionClick = (optId: string) => {
    onSelect(optId);
  };

  const handleDialChange = (value: number) => {
    // For dial questions, we map the value to the appropriate option
    let optionId = 'low';
    if (value >= 75) optionId = 'high';
    else if (value >= 25) optionId = 'medium';
    onSelect(optionId, value);
  };

  const getDialValue = () => {
    if (!selected?.choice) return 0;
    const option = question.options.find(opt => opt.id === selected.choice);
    return option?.value || 0;
  };

  const renderQuestionContent = () => {
    const layout = question.layout || 'icons';

    switch (layout) {
      case 'dial':
        return (
          <LinearSlider

            value={getDialValue()}
            onChange={handleDialChange}
          />
        );

      case 'radio-list':
        return (
          <RadioListQuestion
            options={question.options}
            selectedId={selected?.choice}
            onSelect={(optId) => onSelect(optId)}
          />
        );

      case 'icons':
      default:
        return (
          <div className="question-options">
            {question.options.map((option) => (
              <button
                key={option.id}
                className={`question-option ${selected?.choice === option.id ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option.id)}
              >
                {option.icon && (
                  <span className="option-icon-wrap">
                    <img
                      src={option.icon}
                      alt={`${option.label} icon`}
                      className="option-icon"
                    />
                  </span>
                )}
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="question-screen">
      <Stepper 
        currentStep={step} 
        totalSteps={total} 
        onClose={onClose}
      />
      
      <div className="question-content">
        <div className="question-section">
          <h1 className="question-title">{question.title}</h1>
          
          {renderQuestionContent()}
          
          <div className="question-navigation">
            <button 
              className="nav-button secondary"
              onClick={onPrevious}
              disabled={step === 1}
            >
              PREVIOUS
            </button>
            
            <button
              className="nav-button primary"
              onClick={onNext}
              disabled={!selected}
            >
              {step === total ? 'FINISH' : 'NEXT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
