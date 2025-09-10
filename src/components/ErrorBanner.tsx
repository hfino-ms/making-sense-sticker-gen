import type { FC } from 'react';
import styles from './ErrorBanner.module.css';

type Props = { children: React.ReactNode };

const ErrorBanner: FC<Props> = ({ children }) => (
  <div className={styles.errorBanner} role="alert">{children}</div>
);

export default ErrorBanner;
