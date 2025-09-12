import { useState, type FormEvent, useRef, useEffect } from 'react';
import styles from './EmailCapture.module.css';
import Button from './ui/Button';
import Divider from './ui/Divider';
import MotionSection from './MotionSection';

type Props = { onSubmit: (email: string) => void };

const EmailCapture = ({ onSubmit }: Props) => {
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Programmatically focus the input to help trigger the on-screen keyboard on mobile devices.
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim());
    }
  };

  return (
    <MotionSection animateKey="emailCapture" duration={360} className={styles.emailScreen}>
      <div className={styles.emailSection}>
        <div className={styles.emailHeaderSection}>
          <h1 className={styles.emailTitle}>Get Your AI Agent</h1>

          <Divider />

          <p className={styles.emailDescription}>
            Enter your email address below,
            <br />
            and we'll send your new AI Agent directly to your inbox.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.emailForm}>
          <div className={styles.emailInputWrapper}>
            <input
              ref={inputRef}
              type="email"
              className={styles.emailInput}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <Button className={styles.emailSubmitButton} type="submit" variant="primary">
            SUBMIT
          </Button>
        </form>
      </div>
    </MotionSection>
  );
};

export default EmailCapture;
