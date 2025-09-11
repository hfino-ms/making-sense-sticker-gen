import styles from './AnimatedSection.module.css';

type Props = {
  animateKey?: string | number;
  duration?: number; // ms - kept for API compatibility
  children?: React.ReactNode;
  className?: string;
};

// Simplified AnimatedSection: passthrough container with optional CSS fade-in on mount.
// This avoids complex state and guarantees immediate rendering of children so app flow works.
export default function AnimatedSection({ duration = 360, children, className = '' }: Props) {
  const cls = `${styles.container} ${className}`;
  return (
    <div className={cls} style={{ ['--anim-duration' as any]: `${duration}ms` }}>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
