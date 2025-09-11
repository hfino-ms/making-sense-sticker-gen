import type { Question } from '../types';
import LinearSlider from './LinearSlider';
import RadioListQuestion from './RadioListQuestion';
import styles from './QuestionScreen.module.css';
import Button from './ui/Button';
import AnimatedSection from './AnimatedSection';
import type { FC } from 'react';

type Props = {
  question: Question;
  selected?: { choice: string; intensity?: number };
  onSelect: (optionId: string, intensity?: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose?: () => void;
  step: number;
  total: number;
};

const QuestionScreen: FC<Props> = ({
  question,
  selected,
  onSelect,
  onNext,
  onPrevious,
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
          <AnimatedSection animateKey={`dial-${selected?.choice || getDialValue()}`} duration={260}>
            <LinearSlider
              value={getDialValue()}
              onChange={handleDialChange}
            />
          </AnimatedSection>
        );

      case 'radio-list':
        return (
          <AnimatedSection animateKey={`radlist-${selected?.choice || ''}`} duration={260}>
            <RadioListQuestion
              options={question.options}
              selectedId={selected?.choice}
              onSelect={(optId) => onSelect(optId)}
            />
          </AnimatedSection>
        );

      case 'icons':
      default:
        return (
          <AnimatedSection animateKey={`icons-${selected?.choice || ''}`} duration={260}>
            <div className={styles.questionCardsContainer}>
              <div className={styles.questionOptions}>
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    className={`${styles.questionOption} ${selected?.choice === option.id ? styles.questionOptionSelected : ''}`}
                    onClick={() => handleOptionClick(option.id)}
                  >
                    {option.icon && (
                      <div className={styles.optionIcon}>
                        <img
                          src={option.icon}
                          alt={`${option.label} icon`}
                        />
                      </div>
                    )}
                    <div className={styles.optionLabel}>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </AnimatedSection>
        );
    }
  };

  return (
    <div className="screen-container">
      <div className={styles.questionMain}>
        <div className={styles.questionSection}>
          <div className={styles.questionHeaderSection}>
            <h1 className={styles.questionTitle}>{question.title}</h1>
          </div>

          {renderQuestionContent()}

          <div className={styles.questionNavigation}>
            <Button variant="secondary" onClick={onPrevious} disabled={step === 1}>
              PREVIOUS
            </Button>
            <Button variant="primary" onClick={onNext} disabled={!selected}>
              {step === total ? 'FINISH' : 'NEXT'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
