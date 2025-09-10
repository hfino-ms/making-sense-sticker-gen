import styles from './Button.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text';
  mobileFull?: boolean;
};

export default function Button({ variant = 'primary', mobileFull = true, className = '', children, ...rest }: Props) {
  const variantClass = variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : variant === 'text' ? styles.text : styles.ghost;
  const mobileFullClass = mobileFull ? styles.fullWidthOnMobile : '';
  return (
    <button className={`${styles.btn} ${variantClass} ${mobileFullClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
