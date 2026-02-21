import { useState, useEffect, useRef } from 'react';

/**
 * Hook to animate a number from its previous value to the new target.
 * On first data load (transition from 0), jumps directly without animation.
 * On subsequent target changes (e.g. filter changes), animates smoothly.
 * @param target - The target number to animate to
 * @param duration - Animation duration in milliseconds (default: 1000)
 * @returns The current animated value
 */
export function useAnimatedNumber(target: number, duration: number = 1000): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const startValue = prevRef.current;
    prevRef.current = target;

    // Don't animate from 0 — just snap to the target immediately (initial data load)
    if (startValue === 0 || startValue === target) {
      setCurrent(target);
      return;
    }

    const startTime = Date.now();
    let rafId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startValue + (target - startValue) * easeOut));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return current;
}
