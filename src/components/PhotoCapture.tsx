import { useRef, useState, useCallback, useEffect } from 'react';

import Webcam from 'react-webcam';

type Props = {
  onConfirm: (dataUrl?: string) => void;
  onSkip: () => void;
};

export default function PhotoCapture({ onConfirm, onSkip }: Props) {
  const webcamRef = useRef<Webcam | null>(null);
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
    <div className="photo-capture-screen">
      <div className="photo-capture-section">
        <h1 className="photo-capture-title">
          Go beyond and<br />
          personalize your robot
        </h1>
        
        <div className="photo-capture-divider">
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
        
        <p className="photo-capture-description">
          Take a selfie to customize your robot's features to match your unique style.
        </p>
        
        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="camera-container">
          {cameraStarted && !snapshot && (
            <div className="camera-frame">
              <Webcam
                audio={false}
                ref={webcamRef}
                mirrored
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="camera-video"
              />
            </div>
          )}

          {snapshot && (
            <div className="photo-preview">
              <img src={snapshot} alt="Selfie preview" className="preview-image" />
            </div>
          )}
        </div>
        
        <div className="photo-capture-buttons">
          {!snapshot && !cameraStarted && (
            <>
              <button className="nav-button secondary outlined" onClick={onSkip}>SKIP</button>
              <button className="nav-button primary" onClick={startCamera}>OPEN CAMERA</button>

            </>
          )}
          
          {cameraStarted && !snapshot && (
            <>
              <button className="nav-button secondary" onClick={stopCamera}>CLOSE</button>
              <button className="nav-button primary" onClick={takePhoto} disabled={loading}>
                {loading ? 'TAKING...' : 'TAKE PHOTO'}
              </button>
            </>
          )}
          
          {snapshot && (
            <>
              <button className="nav-button secondary" onClick={retake}>RETAKE</button>
              <button className="nav-button primary" onClick={confirm}>USE PHOTO</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
