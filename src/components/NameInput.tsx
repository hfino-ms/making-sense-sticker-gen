import { useState, type FormEvent } from 'react';
import styles from './NameInput.module.css';
import Button from './ui/Button';
import MotionSection from './MotionSection';

type Props = { onContinue: (name: string) => void };

const NameInput = ({ onContinue }: Props) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onContinue(name.trim());
    }
  };

  return (
    <MotionSection animateKey="nameInput" duration={360} className="screen-container">
      <div className={styles.nameSection}>
        <div className={styles.nameContent}>
          <div className={styles.nameHeaderSection}>
            <h1 className={styles.nameTitle}>What should I call you?</h1>
            <form onSubmit={handleSubmit} className={styles.nameForm}>
              <div className={styles.nameInputWrapper}>
                <div className={styles.nameInputField}>
                  <div className={styles.nameInputContainer}>
                    <input
                      type="text"
                      className={styles.nameInput}
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              <div className={styles.nameButtonWrapper}>
                <Button type="submit" variant="primary" disabled={!name.trim()}>
                  CONTINUE
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MotionSection>
  );
};

export default NameInput;
