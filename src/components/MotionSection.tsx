import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

const MotionDiv: any = motion.div;

type Props = {
  animateKey?: string | number;
  duration?: number; // ms
  children?: ReactNode;
  className?: string;
};

export default function MotionSection({ animateKey, duration = 900, children, className = '' }: Props) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = reducedMotion ? 0 : (duration / 1000);
  const transition = { duration: dur, ease: [0.19, 0.85, 0.22, 1] };

  const variants = {
    initial: { opacity: 0, y: 12, scale: 0.992 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.992 },
  };

  return (
    <AnimatePresence mode="wait">
      <MotionDiv
        key={animateKey ?? 'default'}
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
      >
        {children}
      </MotionDiv>
    </AnimatePresence>
  );
}
