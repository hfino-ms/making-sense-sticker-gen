import type { QuestionOption } from '../types';

type Props = {
  options: QuestionOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
};

const RadioListQuestion = ({ options, selectedId, onSelect }: Props) => {
  return (
    <div className="radio-list-container">
      {options.map((option) => (
        <button
          key={option.id}
          className={`radio-option ${selectedId === option.id ? 'selected' : ''}`}
          onClick={() => onSelect(option.id)}
        >
          <div className={`radio-button ${selectedId === option.id ? 'checked' : ''}`}>
            {selectedId === option.id && <div className="radio-dot"></div>}
          </div>
          <span className="radio-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default RadioListQuestion;
