import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import styles from './PhotoCapture.module.css';
import Button from './ui/Button';
import Divider from './ui/Divider';
import AnimatedSection from './AnimatedSection';

type Props = {
  onConfirm: (dataUrl?: string) => void;
  onSkip: () => void;
};

export default function PhotoCapture({ onConfirm, onSkip }: Props) {
  const webcamRef = useRef<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: 640 },
    height: { ideal: 640 },
    facingMode: 'user',
  };

  useEffect(() => {
    return () => {
      setCameraStarted(false);
    };
  }, []);

  const startCamera = useCallback(() => {
    setError(null);
    setCameraStarted(true);
  }, []);

  const stopCamera = useCallback(() => {
    setCameraStarted(false);
  }, []);

  // Capture a square centered crop from the underlying video element to avoid stretching
  const takePhoto = useCallback(() => {
    setError(null);
    setLoading(true);
    try {
      const videoEl: HTMLVideoElement | undefined = (webcamRef.current as any)?.video ?? undefined;
      if (!videoEl) {
        setError('Camera not available');
        setLoading(false);
        return;
      }
      const vw = videoEl.videoWidth || videoEl.clientWidth;
      const vh = videoEl.videoHeight || videoEl.clientHeight;
      const size = Math.min(vw, vh);
      const sx = Math.max(0, (vw - size) / 2);
      const sy = Math.max(0, (vh - size) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Capture failed');
        setLoading(false);
        return;
      }
      ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSnapshot(dataUrl);
    } catch (e) {
      setError('Capture failed');
    } finally {
      setLoading(false);
      setCameraStarted(false);
    }
  }, []);

  const confirm = () => onConfirm(snapshot ?? undefined);
  const retake = () => {
    setSnapshot(null);
    setError(null);
    setCameraStarted(true);
  };

  return (
    <div className={styles.photoScreen}>
      <div className={styles.photoSection}>
        <h1 className={styles.photoTitle}>
          Go beyond and<br />
          personalize your character
        </h1>

        <Divider />

        <p className={styles.photoDescription}>
          Take a selfie to customize your character's features to match your unique style.
        </p>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}

        <AnimatedSection animateKey={`camera-${cameraStarted ? 'on' : 'off'}-${snapshot ? 'snap' : 'nosnap'}`} duration={360}>
          <div className={styles.cameraContainer}>
            {cameraStarted && !snapshot && (
              <div className={styles.cameraFrame}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  mirrored
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className={styles.cameraVideo}
                />
              </div>
            )}

            {snapshot && (
              <div className={styles.photoPreview}>
                <img src={snapshot} alt="Selfie preview" className={styles.previewImage} />
              </div>
            )}
          </div>


          <div className={styles.photoButtons}>
            {!snapshot && !cameraStarted && (
              <>
                <Button variant="secondary" onClick={onSkip}>SKIP</Button>
                <Button variant="primary" onClick={startCamera}>OPEN CAMERA</Button>

              </>
            )}

            {cameraStarted && !snapshot && (
              <>
                <Button variant="secondary" onClick={stopCamera}>CLOSE</Button>
                <Button variant="primary" onClick={takePhoto} disabled={loading}>{loading ? 'TAKING...' : 'TAKE PHOTO'}</Button>
              </>
            )}

            {snapshot && (
              <>
                <Button variant="secondary" onClick={retake}>RETAKE</Button>
                <Button variant="primary" onClick={confirm}>USE PHOTO</Button>
              </>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
