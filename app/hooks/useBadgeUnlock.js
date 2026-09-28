import { useState, useRef, useEffect } from 'react';
export default function useBadgeUnlock(badges) {
  const seenRef = useRef(null);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  useEffect(() => {
    if (!badges) return;
    if (seenRef.current === null) {
      seenRef.current = new Set(badges);
      return;
    }
    const newOnes = badges.filter(b => !seenRef.current.has(b));
    seenRef.current = new Set(badges);
    if (newOnes.length > 0) setUnlockedBadge(newOnes[0]);
  }, [badges]);
  return {
    unlockedBadge,
    dismissBadgeUnlock: () => setUnlockedBadge(null)
  };
}
