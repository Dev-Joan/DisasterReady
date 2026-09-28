import React, { useState, useEffect, useRef } from 'react';
import Text from './Text';
import { useAccessibility } from '../context/AccessibilityContext';
export default function CountUpNumber({
  value,
  suffix = '',
  duration = 800,
  style
}) {
  const {
    settings: a11y
  } = useAccessibility();
  const [display, setDisplay] = useState(0);
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
