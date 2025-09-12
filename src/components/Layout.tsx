import type { FC, ReactNode } from 'react';
import styles from './Layout.module.css';

type Props = {
  children: ReactNode;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onClose?: () => void;
};

const Layout: FC<Props> = ({ children, showProgress = false, currentStep = 1, totalSteps = 5, onClose }) => {
  const LOGO_FIGMA = 'https://api.builder.io/api/v1/image/assets/TEMP/7ac03e2ebbcf31266708d63245588e89126c6e4a?width=442';

  return (
    <div className={styles.appRoot}>

      {/* Hero animated background */}
      <div className={styles.heroAnimationWrapper} aria-hidden>
        <div className={styles.heroAnimation}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Header Navigation */}
      <header className={styles.appHeader}>
        <img
          src={LOGO_FIGMA}
          alt="Making Sense"
          className={styles.logo}
        />
      </header>

      {/* Progress Stepper */}
      {showProgress && (
        <div className={styles.stepper}>
          <div className={styles.steps}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div 
                key={i} 
                className={`${styles.stepItem} ${i < currentStep ? styles.stepActive : styles.stepTodo}`}
              >
                <div className={styles.stepLine}></div>
              </div>
            ))}
          </div>
          {onClose && (
            <div className={styles.menu}>
              <button onClick={onClose} className={styles.closeButton} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.2458 12.8317C11.3834 12.9693 11.3834 13.1933 11.2458 13.332L8.41917 16.1608C8.34984 16.2301 8.25917 16.2642 8.16957 16.2642C8.07997 16.2642 7.9893 16.2301 7.91997 16.1608C7.78237 16.0232 7.78237 15.7992 7.91997 15.6605L10.7466 12.8317C10.8842 12.693 11.1082 12.6941 11.2469 12.8317H11.2458ZM7.3589 6.82317C7.2213 6.68557 6.9973 6.68557 6.85864 6.82317C6.72104 6.96077 6.72104 7.18476 6.85864 7.32343L16.7541 17.2189C16.8234 17.2882 16.913 17.3224 17.0037 17.3224C17.0944 17.3224 17.185 17.2882 17.2533 17.2189C17.3909 17.0813 17.3909 16.8573 17.2533 16.7186L7.35784 6.82317H7.3589ZM16.7552 6.82317L12.8672 10.7101C12.7296 10.8477 12.7296 11.0717 12.8672 11.2104C12.9365 11.2797 13.0261 11.3138 13.1168 11.3138C13.2074 11.3138 13.2981 11.2797 13.3664 11.2104L17.2544 7.32343C17.392 7.18583 17.392 6.96184 17.2544 6.82317C17.1168 6.68557 16.8928 6.68557 16.7541 6.82317H16.7552ZM7.38343 17.2445C7.40157 17.2253 7.41757 17.2072 7.43144 17.1848C7.4453 17.1645 7.45704 17.141 7.46771 17.1176C7.4773 17.0952 7.4837 17.0706 7.48903 17.0461C7.49543 17.0205 7.49757 16.9949 7.49757 16.9693C7.49757 16.8669 7.45597 16.7666 7.38343 16.6952C7.23943 16.5501 6.9781 16.5501 6.8341 16.6952C6.76157 16.7666 6.71997 16.8669 6.71997 16.9693C6.71997 16.9949 6.7221 17.0205 6.72744 17.0461C6.73384 17.0706 6.74023 17.0952 6.74983 17.1176C6.75943 17.141 6.77224 17.1645 6.7861 17.1848C6.79997 17.2072 6.81597 17.2264 6.8341 17.2445C6.90557 17.316 7.00584 17.3576 7.10824 17.3576C7.21064 17.3576 7.3109 17.316 7.38237 17.2445H7.38343Z" fill="#102532"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className={showProgress ? styles.mainContentWithStepper : styles.mainContent}>
        {children}
      </main>

      {/* Footer */}
      <footer className={styles.appFooter}>
        Making Sense - 2025. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
