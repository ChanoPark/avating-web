import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { DUR_BASE, EASE_STANDARD } from '@shared/lib/motion';

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: DUR_BASE, ease: EASE_STANDARD }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
