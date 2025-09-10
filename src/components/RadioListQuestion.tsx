import type { QuestionOption } from '../types';
import styles from './RadioListQuestion.module.css';

type Props = {
  options: QuestionOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
};

const RadioListQuestion = ({ options, selectedId, onSelect }: Props) => {
  return (
    <div className={styles.radioListContainer}>
      {options.map((option) => (
        <button
          key={option.id}
          className={`${styles.radioOption} ${selectedId === option.id ? styles.radioOptionSelected : ''}`}
          onClick={() => onSelect(option.id)}
        >
          <div className={`${styles.radioButton} ${selectedId === option.id ? styles.radioButtonChecked : ''}`}>
            {selectedId === option.id && <div className={styles.radioDot}></div>}
          </div>
          <span className={styles.radioLabel}>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default RadioListQuestion;
