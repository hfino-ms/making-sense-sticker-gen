import type { FC } from 'react';

type Props = { message?: string };

const LoadingScreen: FC<Props> = ({ message }) => {
  return (
    <div className="screen-container">
      <div className="spinner" />
      <p className="intro-copy">{message ?? 'Analyzing your responses... Generating your AI robot...'}</p>
    </div>
  );
};

export default LoadingScreen;
