import { useState } from 'react';
import type { FormEvent } from 'react';
import styles from './EmailCapture.module.css';
import Button from './ui/Button';

type Props = { onSubmit: (email: string) => void; onSkip?: () => void; };

const EmailCapture = ({ onSubmit, onSkip }: Props) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim());
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className={styles.emailScreen}>
      <div className={styles.emailSection}>
        <h1 className={styles.emailTitle}>Looking forward to making sense with you</h1>

        <div className={styles.emailDivider}>
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

        <p className={styles.emailDescription}>
          Would you like to get personalized insights for your business?<br />
          Leave us your email and we'll reach out to you.
        </p>

        <form onSubmit={handleSubmit} className={styles.emailForm}>
          <div className={styles.emailInputWrapper}>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary">SUBMIT</Button>
        </form>

        <div className={styles.emailSkipButton}>
          <Button variant="text" onClick={handleSkip}>SKIP</Button>
        </div>
      </div>
    </div>
  );
};

export default EmailCapture;
