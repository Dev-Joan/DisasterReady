export const BADGE_CATALOG = {
  flood_kids: { emoji: '🌊', title: 'Flood Hero', description: 'Packed a flood emergency kit perfectly.' },
  earthquake_kids: { emoji: '🏚️', title: 'Quake Hero', description: 'Completed the earthquake kit challenge.' },
  fire_kids: { emoji: '🔥', title: 'Fire Hero', description: 'Completed the fire escape challenge.' },
  streak_7: { emoji: '🔥', title: '7-Day Streak', description: 'Logged in 7 days in a row.' },
  rank_prepared: { emoji: '🛡️', title: 'Prepared Rank', description: 'Reached the Prepared rank.' },
  rank_resilient: { emoji: '🎖️', title: 'Resilient Rank', description: 'Reached the Resilient rank.' },
  rank_guardian: { emoji: '👑', title: 'Guardian Rank', description: 'Reached the Guardian rank.' },
  flood_kit_hero: { emoji: '🎒', title: 'Flood Safety Hero', description: 'Packed the perfect flood emergency kit.' },
  earthquake_mastered: { emoji: '🏆', title: 'Earthquake Topic Mastered', description: 'Reached mastery on earthquake quiz questions.' },
  flood_mastered: { emoji: '🏆', title: 'Flood Topic Mastered', description: 'Reached mastery on flood quiz questions.' },
  knowledge_check_complete: { emoji: '🎓', title: 'Knowledge Check Complete', description: 'Completed every chapter of the Knowledge Check.' },
  route_hero: { emoji: '🗺️', title: 'Route Hero', description: 'Found a safe escape route before the flood water arrived.' },
  sequence_hero: { emoji: '📋', title: 'Sequence Hero', description: 'Put every earthquake safety step in the right order.' },
  safehouse_hero: { emoji: '🏠', title: 'Safe House Hero', description: 'Built a fire-safe room and passed the test.' },
  dispatch_hero: { emoji: '📞', title: 'Dispatch Hero', description: 'Triaged emergencies and sent a clear, correct message.' },
  family_planner: { emoji: '👨‍👩‍👧‍👦', title: 'Family Planner', description: 'Built a real family emergency plan.' }
};

export function getBadgeInfo(badgeId) {
  return BADGE_CATALOG[badgeId] || { emoji: '🏅', title: badgeId, description: 'Earned badge.' };
}
