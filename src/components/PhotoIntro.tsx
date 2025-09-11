import styles from './PhotoIntro.module.css';
import Button from './ui/Button';
import Divider from './ui/Divider';

type Props = { onOpenCamera: () => void; onSkip: () => void };

const PhotoIntro = ({ onOpenCamera, onSkip }: Props) => {
  return (
    <div className={styles.photoIntroScreen}>
      <div className={styles.photoIntroSection}>
        <h1 className={styles.photoIntroTitle}>Go beyond and<br />personalize your character</h1>

        <Divider />

        <p className={styles.photoIntroDescription}>Take a selfie to customize your character's features to match your unique style.</p>

        <div className={styles.photoIntroButtons}>
          <Button variant="text" onClick={onSkip}>SKIP</Button>
          <Button variant="primary" onClick={onOpenCamera}>OPEN CAMERA</Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoIntro;
