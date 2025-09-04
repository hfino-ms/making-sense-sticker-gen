import type { FC } from 'react';

type Props = { onStart: () => void };

const SplashScreen: FC<Props> = ({ onStart }) => {
  return (
    <div className="screen-container">
      <div className="brand-header">
        <div className="brand-logo" aria-hidden />
        <h1 className="brand-title">Making Sense
          <span className="brand-sub">AI Archetype Sticker</span>
        </h1>
      </div>
      <p className="intro-copy">Discover your AI archetype. Answer 5 quick questions and get your exclusive sticker.</p>
      <button className="primary-button" onClick={onStart}>
        Start
      </button>
      <p className="privacy-note">No data is stored after printing. Internet connection required.</p>
    </div>
  );
};

export default SplashScreen;
