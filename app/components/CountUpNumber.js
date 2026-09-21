import React, { useState, useEffect, useRef } from 'react';
import Text from './Text';

// Counts up from 0 (or from the previous value) to `value` instead of
// snapping straight to the new number. `suffix` lets callers add "%", " XP",
// "-day streak", etc. without re-implementing the animation each time.
export default function CountUpNumber({ value, suffix = '', duration = 800, style }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    let raf;
    const start = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    tick();
    return () => raf && cancelAnimationFrame(raf);
  }, [value, duration]);

  return <Text style={style}>{display}{suffix}</Text>;
}
