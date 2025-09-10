import type { GenerationResult } from '../types';
import styles from './ResultScreen.module.css';
import Button from './ui/Button';
import { useState, useRef } from 'react';
import { composeStickerFromSource } from '../utils/composeSticker';
import type { FC } from 'react';

type Props = {
  result: GenerationResult;
  userName?: string;
  userEmail?: string;
  onShare: () => void;
  onPrint: () => void;
  onRestart?: () => void;
};

const ResultScreen: FC<Props> = ({ result, userName, onShare, onPrint, onRestart }) => {
  const { archetype, imageUrl } = result as any;
  // Use the frame URL directly - no complex composition
  // Choose sticker source (prefer server-provided full image URL or data URL)
  const stickerSource = (result as any)?.imageDataUrl || imageUrl;

  // Compose sticker for export (include frame overlay) — wrap the shared util
  const composeSticker = async (): Promise<string> => {
    return composeStickerFromSource(stickerSource);
  };

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  const composeAndGetDataUrl = async (): Promise<string> => {
    try {
      const data = await composeSticker();
      return data;
    } catch (e) {
      return stickerSource || '';
    }
  };

  const showPreview = async () => {
    const data = await composeAndGetDataUrl();
    setPreviewSrc(data || null);
    setPreviewOpen(true);
  };

  const downloadPreview = () => {
    if (!previewSrc) return;
    const a = downloadRef.current;
    if (!a) return;
    a.href = previewSrc;
    a.download = `${archetype?.name || 'sticker'}.png`;
    a.click();
  };

  const copyBase64 = async () => {
    if (!previewSrc) return;
    const b64 = previewSrc.split(',')[1] || previewSrc;
    try {
      await navigator.clipboard.writeText(b64);
      // brief visual feedback could be added here
    } catch (e) {
      console.warn('Failed to copy base64 to clipboard', e);
    }
  };

  const printSticker = async () => {
    const w = window.open('', '_blank');
    if (!w) {
      onPrint();
      return;
    }
    let outSrc = stickerSource;
    try {
      outSrc = await composeSticker();
    } catch (e) {
      outSrc = stickerSource;
    }

    w.document.write(`<html><head><title>${archetype.name} Sticker</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;">
      <img src="${outSrc}" style="max-width:90vw;max-height:90vh;object-fit:contain;"/>
      <script>window.onload=function(){setTimeout(function(){window.print();}, 300)}<\/script>
    </body></html>`);
    w.document.close();
    setTimeout(() => onPrint(), 1000);
  };


  const providerError = (result as any)?.providerError || null;

  // Removed automatic submission on mount. Submission should be triggered manually by the user
  // via the Share button below to avoid duplicate webhook triggers and accidental resubmits.


  return (
    <div className={styles.resultContainer}>
      <div className={styles.resultSection}>
        <h1 className={styles.resultTitle}>{userName ? `${userName}, you are a ${archetype.name}!` : `You are ${archetype.name}!`}</h1>

        <div className={styles.resultDivider}>
          <div className={styles.dividerLine}></div>
          <svg width="5" height="4" viewBox="0 0 5 4" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.dividerDot}>
            <circle cx="2.5" cy="2" r="2" fill="url(#paint0_linear)"/>
            <defs>
              <linearGradient id="paint0_linear" x1="0.688744" y1="1.47298" x2="2.12203" y2="3.02577" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1EDD8E"/>
                <stop offset="1" stopColor="#53C0D2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className={styles.resultDescription}>
          <p className={styles.resultLine1}>{archetype.descriptor}</p>
          <p className={styles.resultLine2}>{archetype.valueLine}</p>
        </div>

        {providerError && (
          <div className={styles.resultProviderError}>Generation fallback used: {String(providerError)}</div>
        )}

        {/* Archetype label layer (text) */}
        <div className={styles.archetypeLabel}>{archetype?.name}</div>

        {/* Sticker display contained within a frame overlay */}
        <div className={styles.stickerContainer}>
          <div className={styles.stickerInner}>
            {stickerSource ? (
              <img src={stickerSource} alt="Sticker" className={styles.stickerImage} />
            ) : (
              <div className={styles.stickerPlaceholder} />
            )}
          </div>

          {/* Frame overlay (decorative) */}
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000"
            srcSet="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=1000 1x, https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000 2x"
            alt="frame"
            className={styles.frameOverlay}
            decoding="async"
          />
        </div>

        <div className={styles.resultButtons}>
          <Button variant="secondary" onClick={onShare}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F0f4b2b4c1f4b4b719e6d2d6f3a8b5e6c?format=svg" alt="Share" className={styles.resultButtonIcon} />
            SHARE
          </Button>

          <Button variant="primary" onClick={printSticker}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F1146f9e4771b4cff95e916ed9381032d?format=svg" alt="Print" className={styles.resultButtonIcon} />
            PRINT
          </Button>

          <Button variant="text" onClick={showPreview}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2Fb0d9f3c4e6a14b8aa2c3a9d6f7e8b1c2?format=svg" alt="Preview" className={styles.resultButtonIcon} />
            PREVIEW FILE
          </Button>
        </div>

        {/* Preview area for the composed file that would be saved/sent */}
        {previewOpen && (
          <div className={styles.filePreviewContainer}>
            <div className={styles.filePreviewImageWrapper}>
              {previewSrc ? (
                <img src={previewSrc} alt="Composed preview" className={styles.filePreviewImage} />
              ) : (
                <div className={styles.filePreviewPlaceholder}>No preview available</div>
              )}
            </div>

            <div className={styles.previewActions}>
              <a ref={downloadRef} style={{ display: 'none' }} />
              <button className={styles.previewButton} onClick={downloadPreview}>Download PNG</button>
              <button className={styles.previewButton} onClick={() => window.open(previewSrc || '', '_blank')}>Open in new tab</button>
              <button className={styles.previewButton} onClick={copyBase64}>Copy base64</button>
              <button className={styles.previewButton} onClick={() => { setPreviewOpen(false); setPreviewSrc(null); }}>Close</button>
            </div>
          </div>
        )}

        <div className={styles.startOverSection}>
          <Button variant="text" onClick={onRestart || (() => window.location.reload())}>
            START OVER
          </Button>
        </div>

        <div className={styles.resultEmail}>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
