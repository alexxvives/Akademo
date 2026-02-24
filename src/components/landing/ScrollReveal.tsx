'use client';

import { useEffect, useRef } from 'react';

type Direction = 'up' | 'left' | 'right' | 'none' | 'zoom' | 'blur' | 'flip' | 'zoom-in';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: Direction;
  threshold?: number;
}

const DIR_CLASS: Record<Direction, string> = {
  up:      'sr-from-up',
  left:    'sr-from-left',
  right:   'sr-from-right',
  none:    'sr-from-none',
  zoom:    'sr-from-zoom',
  blur:    'sr-from-blur',
  flip:    'sr-from-flip',
  'zoom-in': 'sr-from-zoom-in',
};

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.1,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add('sr-visible');
          }, delay);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -48px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={`sr-base ${DIR_CLASS[direction]} ${className}`}>
      {children}
    </div>
  );
}
