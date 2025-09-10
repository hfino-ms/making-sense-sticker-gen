import styles from './SplashScreen.module.css';
import Button from './ui/Button';

type Props = { onStart: () => void };

const SplashScreen = ({ onStart }: Props) => {
  return (
    <div className="screen-container">
      <div className={styles.sectionOne}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Find Your AI Agent</h1>
          
          <div className={styles.heroDivider}>
            <div className={styles.dividerLine}></div>
            <svg 
              className={styles.dividerDot}
              width="5" 
              height="5" 
              viewBox="0 0 5 5" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="2.5" cy="2.5" r="2" fill="url(#paint0_linear_splash)"/>
              <defs>
                <linearGradient 
                  id="paint0_linear_splash" 
                  x1="0.688744" 
                  y1="1.97298" 
                  x2="2.12203" 
                  y2="3.52577" 
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#1EDD8E"/>
                  <stop offset="1" stopColor="#53C0D2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <p className={styles.heroDescription}>
            Uncover the digital ally that thinks like you, moves with you, and amplifies your every decision.
            <br /><br />
            In the fast pace of Private Equity, every choice shapes the future. Let your AI Agent be the silent partner that turns instinct into insight, and vision into value.
          </p>

          <div className={styles.heroButton}>
            <Button variant="primary" onClick={onStart}>LET'S START</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
