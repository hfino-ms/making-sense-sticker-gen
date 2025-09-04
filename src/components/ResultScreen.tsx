import type { FC } from 'react';
import type { GenerationResult } from '../types';

type Props = {
  result: GenerationResult;
  onRestart: () => void;
};

const ResultScreen: FC<Props> = ({ result, onRestart }) => {
  const { archetype, imageUrl, prompt, source, providerError } = result;

  const printSticker = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${archetype.name} Sticker</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;">
      <img src="${imageUrl}" style="width:80vmin;height:80vmin;object-fit:contain;"/>
      <script>window.onload=function(){setTimeout(function(){window.print();}, 300)}<\/script>
    </body></html>`);
    w.document.close();
  };

  const shareSticker = async () => {
    const fileName = `${archetype.name.replace(/\s+/g, '-')}-sticker.png`;
    try {
      const blob = await (await fetch(imageUrl)).blob();
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
    } catch {
      // no-op
    }
  };

  return (
    <div className="screen-container">
      <div className="result-visual">
        <img src={imageUrl} alt={`${archetype.name} sticker`} className="sticker-image" />
      </div>
      <h2 className="result-title">You are {archetype.name}!</h2>
      <p className="result-subtitle">{archetype.descriptor}</p>
      <p className="result-value">{archetype.valueLine}</p>

      <div className="actions-row">
        <button className="primary-button" onClick={printSticker}>Print Sticker</button>
        <button className="secondary-button" onClick={shareSticker}>Share</button>
        <button className="ghost-button" onClick={onRestart}>Start Over</button>
      </div>

      <div style={{ marginTop: 12, textAlign: 'left', width: '100%', maxWidth: 560 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}><strong>Image source:</strong> {source ?? 'unknown'}</div>
        {providerError && <div style={{ marginTop: 6, color: '#ffb4b4', fontSize: 13 }}><strong>Error:</strong> {providerError}</div>}
        <details style={{ marginTop: 8, color: 'var(--muted)' }}>
          <summary style={{ cursor: 'pointer' }}>View prompt</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{prompt}</pre>
        </details>
      </div>

      <p className="privacy-note">We do not store your photo or answers after printing. Human-centered by design.</p>
    </div>
  );
};

export default ResultScreen;
