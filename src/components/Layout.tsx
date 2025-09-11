import { useEffect, useMemo } from 'react';
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

  // Set theme and enable overlay
  useEffect(() => {
    // ensure overlay starts hidden, then show after a small timeout
    document.documentElement.classList.remove('overlay-ready');
    const t = window.setTimeout(() => {
      document.documentElement.classList.add('overlay-ready');
    }, 300);

    return () => {
      window.clearTimeout(t);
      document.documentElement.classList.remove('overlay-ready');
    };
  }, []);

  // Particle background: generate deterministic particle config on mount to avoid reflows
  const particleConfig = useMemo(() => {
    // Use CSS radial-gradient blobs for the large smooth background (disable small floating particles)
    const amount = 0; // disable particle spans (we rely on CSS blobs instead)
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    // Greens only: darker palette for dark theme, lighter palette for light theme
    const colors = dark
      ? ['#042f28', '#0a6b55', '#0ecc7e'] // dark greens -> deep, mid, bright
      : ['#bff7eb', '#73e6c9', '#0ecc7e']; // light greens -> soft, mid, bright

    const arr = new Array(amount).fill(0).map((_, i) => {
      const sizeVw = 10 + Math.floor(Math.random() * 12); // between 10vw and 22vw roughly
      const top = Math.floor(Math.random() * 90);
      const left = Math.floor(Math.random() * 90);
      const duration = (6 + Math.random() * 6).toFixed(2) + 's';
      const delay = '-' + (Math.random() * 6).toFixed(2) + 's';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const blur = Math.floor(8 + Math.random() * 24);
      const x = Math.random() > 0.5 ? -1 : 1;
      const boxShadow = `${sizeVw * 1.8 * x}px 0 ${blur}px ${color}`;
      const transformOrigin = `${Math.floor((Math.random() - 0.5) * 40)}vw ${Math.floor((Math.random() - 0.5) * 40)}vh`;
      return { sizeVw, top, left, duration, delay, color, boxShadow, transformOrigin, key: `p-${i}` };
    });
    return arr;
  }, []);

  return (
    <div className={styles.appRoot}>
      {/* Animated Background with Particles */}
      <div className={styles.themeOverlay} aria-hidden>
        {particleConfig.map((p) => (
          <span
            key={p.key}
            className={styles.themeParticle}
            style={{
              ['--tp-top' as any]: p.top + '%',
              ['--tp-left' as any]: p.left + '%',
              ['--tp-size' as any]: `min(${p.sizeVw}vmin, 140px)`,
              ['--tp-bg' as any]: p.color,
              ['--tp-shadow' as any]: p.boxShadow,
              ['--tp-transform-origin' as any]: p.transformOrigin,
              ['--tp-duration' as any]: p.duration,
              ['--tp-delay' as any]: p.delay,
            }}
          />
        ))}
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
