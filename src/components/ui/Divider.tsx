import styles from './Divider.module.css';

type Props = {
  className?: string;
};

export default function Divider({ className = '' }: Props) {
  return (
    <div className={`${styles.divider} ${className}`}>
      <div className={styles.dividerLine}></div>
      <svg 
        width="5" 
        height="4" 
        viewBox="0 0 5 4" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={styles.dividerDot}
      >
        <circle cx="2.5" cy="2" r="2" fill="url(#paint0_linear_divider)"/>
        <defs>
          <linearGradient 
            id="paint0_linear_divider" 
            x1="0.688744" 
            y1="1.47298" 
            x2="2.12203" 
            y2="3.02577" 
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1EDD8E"/>
            <stop offset="1" stopColor="#53C0D2"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
