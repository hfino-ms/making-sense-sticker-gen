import { useState } from 'react';
import type { Archetype } from '../types';

type Props = {
  archetype: Archetype;
  prompt: string;
  onChange: (newPrompt: string) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  loading?: boolean;
};

export default function PromptPreview({ archetype, prompt, onChange, onGenerate, onRegenerate, loading }: Props) {
  const [local, setLocal] = useState(prompt);

  return (
    <div className="screen-container">
      <h2 className="question-title">Prompt preview</h2>
      <p className="intro-copy">Review or tweak the prompt that will be sent to the image generator.</p>

      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: 8, textAlign: 'center' }}>
          <strong style={{ color: 'var(--gradient1-textContrast)' }}>{archetype.name}</strong>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{archetype.descriptor}</div>
        </div>

        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onChange(local)}
          rows={8}
          style={{ width: '100%', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.02)', color: 'var(--gradient1-textContrast)', border: '1px solid rgba(255,255,255,0.04)' }}
        />
      </div>

      <div className="actions-row">
        <button className="secondary-button" onClick={() => { setLocal(prompt); onChange(prompt); }} disabled={loading}>Reset</button>
        <button className="ghost-button" onClick={onRegenerate} disabled={loading}>Regenerate Prompt</button>
        <button className="primary-button" onClick={onGenerate} disabled={loading}>{loading ? 'Generating...' : 'Generate Image'}</button>
      </div>

      <p className="privacy-note">You can edit the prompt to adjust style or remove personal references. Changes are not stored.</p>
    </div>
  );
}
