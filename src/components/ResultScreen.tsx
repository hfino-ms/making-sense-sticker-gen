import type { FC } from 'react';
import type { GenerationResult } from '../types';

type Props = {
  result: GenerationResult;
  userName?: string;
  userEmail?: string;
  onShare: () => void;
  onPrint: () => void;
};

const ResultScreen: FC<Props> = ({ result, userName, onShare, onPrint }) => {
  const { archetype, imageUrl } = result as any;
  // Prefer SVG frame asset for crisp rendering (use provided uploaded SVG if available)
  const FRAME_URL = "https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F8822292feba8457299fe95b2e072c9f8?format=svg";

  // Choose sticker source (prefer server-provided full image URL or data URL)
  const stickerSource = (result as any)?.imageDataUrl || imageUrl;

  // We will NOT pre-compose the image to avoid downsampling/pixelation. Instead, render the original sticker
  // and overlay the frame via CSS. For share/print, compose on-demand at the sticker's natural resolution to include the frame.

  // Helper: load image with crossOrigin and return HTMLImageElement
  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

  // Helper: proxy frame to dataUrl to avoid CORS issues when composing
  const proxyFrame = async () => {
    try {
      const proxyResp = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-source': 'ui' },
        body: JSON.stringify({ url: FRAME_URL }),
      });
      if (proxyResp.ok) {
        const pj = await proxyResp.json();
        if (pj?.dataUrl) return pj.dataUrl;
      }
    } catch (e) {
      // ignore
    }
    return FRAME_URL;
  };

  // Compose sticker+frame at original sticker resolution for printing/sharing
  const composeStickerWithFrame = async (): Promise<string> => {
    if (!stickerSource) return '';
    try {
      const proxiedFrameSrc = await proxyFrame();
      const [stickerImg, frameImg] = await Promise.all([loadImage(stickerSource), loadImage(proxiedFrameSrc)]);
      const canvas = document.createElement('canvas');
      const w = stickerImg.naturalWidth || stickerImg.width || 1024;
      const h = stickerImg.naturalHeight || stickerImg.height || 1024;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      // Draw sticker full-bleed
      ctx.drawImage(stickerImg, 0, 0, w, h);
      // Draw frame on top, scaled to cover canvas
      ctx.drawImage(frameImg, 0, 0, w, h);

      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Failed to compose sticker for export', e);
      return stickerSource;
    }
  };

  const printSticker = async () => {
    const w = window.open('', '_blank');
    if (!w) {
      onPrint();
      return;
    }
    let outSrc = stickerSource || FRAME_URL;
    try {
      outSrc = await composeStickerWithFrame();
    } catch (e) {
      outSrc = stickerSource || FRAME_URL;
    }

    w.document.write(`<html><head><title>${archetype.name} Sticker</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;">
      <img src="${outSrc}" style="max-width:90vw;max-height:90vh;object-fit:contain;"/>
      <script>window.onload=function(){setTimeout(function(){window.print();}, 300)}<\/script>
    </body></html>`);
    w.document.close();
    setTimeout(() => onPrint(), 1000);
  };

  const shareSticker = async () => {
    const fileName = `${archetype.name.replace(/\s+/g, '-')}-sticker.png`;
    try {
      const composedDataUrl = await composeStickerWithFrame();
      const res = await fetch(composedDataUrl);
      const blob = await res.blob();
      if (navigator.share && (navigator as any).canShare?.({ files: [new File([blob], fileName, { type: blob.type })] })) {
        await navigator.share({
          title: `${archetype.name} Sticker`,
          text: archetype.valueLine,
          files: [new File([blob], fileName, { type: blob.type })],
        });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      console.error('Share failed, falling back to raw sticker', e);
      try {
        const res = await fetch(stickerSource);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {}
    } finally {
      setTimeout(() => onShare(), 500);
    }
  };

  return (
    <div className="result-screen">

      <div className="result-section">
        <h1 className="result-title">{userName ? `${userName}, you are a ${archetype.name}!` : `You are ${archetype.name}!`}</h1>

        <div className="result-divider">
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

        <div className="result-description">
          <p className="result-line-1">{archetype.descriptor}</p>
          <p className="result-line-2">{archetype.valueLine}</p>
        </div>

        {/* Archetype label layer (text) */}
        <div className="archetype-label">{archetype?.name}</div>

        {/* Sticker displayed as provided by the generator (no pre-composition to avoid pixelation). Frame is overlaid on top. */}
        <div className="sticker-raw-container">
          <img src={stickerSource || FRAME_URL} alt="Sticker" className="sticker-raw-img" />
          <img src={FRAME_URL} alt="Frame overlay" className="sticker-frame-overlay" />
        </div>

        <div className="result-buttons">
          <button className="result-button secondary" onClick={shareSticker}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F46582c5b707c47f389cf1daf4acaea9d?format=svg" alt="Share" className="result-button-icon" />
            SHARE
          </button>

          <button className="result-button primary" onClick={printSticker}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F1146f9e4771b4cff95e916ed9381032d?format=svg" alt="Print" className="result-button-icon" />
            PRINT
          </button>
        </div>

        <div className="result-email">
        </div>
      </div>

    </div>
  );
};

export default ResultScreen;
