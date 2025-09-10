import styles from './PhotoIntro.module.css';
import Button from './ui/Button';

type Props = { onOpenCamera: () => void; onSkip: () => void };

const PhotoIntro = ({ onOpenCamera, onSkip }: Props) => {
  return (
    <div className={styles.photoIntroScreen}>
      <div className={styles.photoIntroSection}>
        <h1 className={styles.photoIntroTitle}>Go beyond and<br />personalize your robot</h1>

        <div className={styles.photoIntroDivider}>
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

        <p className={styles.photoIntroDescription}>Take a selfie to customize your robot's features to match your unique style.</p>

        <div className={styles.photoIntroButtons}>
          <Button variant="text" onClick={onSkip}>SKIP</Button>
          <Button variant="primary" onClick={onOpenCamera}>OPEN CAMERA</Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoIntro;
