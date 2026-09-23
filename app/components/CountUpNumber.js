import React, { useState, useEffect, useRef } from 'react';
import Text from './Text';
import { useAccessibility } from '../context/AccessibilityContext';

// Counts up from 0 (or from the previous value) to `value` instead of
// snapping straight to the new number. `suffix` lets callers add "%", " XP",
// "-day streak", etc. without re-implementing the animation each time.
export default function CountUpNumber({ value, suffix = '', duration = 800, style }) {
  const { settings: a11y } = useAccessibility();
  const [display, setDisplay] = useState(0);
  // Mirrors whatever is actually on screen right now, updated on every
  // frame (not just on natural completion). If `value` changes again while
  // an animation is still in flight, the next run reads FROM here — so it
  // always resumes smoothly from where the number visually is, rather than
  // jumping back to a stale earlier start point. That jump-back was the
  // reproducible glitch: answer two questions faster than `duration` apart
  // and the percentage would visibly snap backward before re-animating.
  const displayRef = useRef(0);

  useEffect(() => {
    if (a11y.reducedMotion) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    let raf;
    const start = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => raf && cancelAnimationFrame(raf);
  }, [value, duration, a11y.reducedMotion]);

  return <Text style={style}>{display}{suffix}</Text>;
}
