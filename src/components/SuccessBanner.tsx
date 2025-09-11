import type { FC, ReactNode } from 'react';
import styles from './SuccessBanner.module.css';

type Props = { children: ReactNode };

const SuccessBanner: FC<Props> = ({ children }) => (
  <div className={styles.successBanner} role="status">{children}</div>
);

export default SuccessBanner;
