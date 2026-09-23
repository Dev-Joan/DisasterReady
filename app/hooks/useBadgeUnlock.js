import { useState, useRef, useEffect } from 'react';

// Detects newly-earned badges by diffing against the last-seen set, so any
// screen can drop this in and get a celebratory "unlock" moment for free —
// pass it whatever `gamification.badges` array it already has (from a quiz
// answer, a minigame-complete response, a lesson-complete response, etc).
//
// The first call just takes a baseline snapshot rather than celebrating —
// otherwise a screen that mounts with a user who already has 12 badges
// would immediately fire 12 "unlocked!" popups. Only badges that appear
// *after* that baseline trigger the overlay.
//
// Only the first newly-earned badge in a batch is surfaced (a screen
// awarding two badges in one action is rare, and queuing multiple unlock
// modals back-to-back would be more confusing than helpful for now).
export default function useBadgeUnlock(badges) {
  const seenRef = useRef(null);
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  useEffect(() => {
    if (!badges) return;
    if (seenRef.current === null) {
      seenRef.current = new Set(badges);
      return;
    }
    const newOnes = badges.filter((b) => !seenRef.current.has(b));
    seenRef.current = new Set(badges);
    if (newOnes.length > 0) setUnlockedBadge(newOnes[0]);
  }, [badges]);

  return { unlockedBadge, dismissBadgeUnlock: () => setUnlockedBadge(null) };
}
