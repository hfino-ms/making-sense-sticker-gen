import { useRef, useState } from 'react';

type Props = {
  onConfirm: (dataUrl?: string) => void;
  onSkip: () => void;
};

export default function PhotoCapture({ onConfirm, onSkip }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.playsInline = true;
        // wait for metadata so videoWidth/Height are available
        await new Promise<void>((resolve) => {
          const v = videoRef.current!;
          const onLoaded = () => { v.removeEventListener('loadedmetadata', onLoaded); resolve(); };
          v.addEventListener('loadedmetadata', onLoaded);
          v.play().catch(() => {/* ignore play error */});
        });
      }
      setCameraStarted(true);
    } catch (e) {
      setError('Camera access denied or unavailable. Please allow camera access.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraStarted(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const size = Math.min(vw, vh);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // center crop
    const sx = Math.max(0, (vw - size) / 2);
    const sy = Math.max(0, (vh - size) / 2);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    setSnapshot(data);
    // stop camera after capture to save resources
    stopCamera();
  };

  const confirm = () => onConfirm(snapshot ?? undefined);

  return (
    <div className="screen-container">
      <h2 className="question-title">Personalize your robot?</h2>
      <p className="intro-copy">Optionally take a selfie to inspire the robot’s features.</p>

      {error && <div className="error-banner">{error}</div>}

      {!cameraStarted && !snapshot && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary-button" onClick={startCamera}>Allow camera</button>
          <button className="ghost-button" onClick={onSkip}>Skip</button>
        </div>
      )}

      {cameraStarted && !snapshot && (
        <div className="camera-frame">
          <video ref={videoRef} playsInline className="camera-video" />
          <div className="camera-overlay" />
        </div>
      )}

      {snapshot && (
        <div className="photo-preview">
          <img src={snapshot} alt="Selfie preview" />
        </div>
      )}

      <div className="actions-row">
        {!snapshot && cameraStarted ? (
          <button className="primary-button" onClick={takePhoto} disabled={!!error}>Take photo</button>
        ) : snapshot ? (
          <button className="secondary-button" onClick={() => { setSnapshot(null); startCamera(); }}>Retake</button>
        ) : null}

        {snapshot && <button className="ghost-button" onClick={onSkip}>Skip</button>}

        <button className="primary-button" onClick={confirm}>Continue</button>

      </div>
    </div>
  );
}
