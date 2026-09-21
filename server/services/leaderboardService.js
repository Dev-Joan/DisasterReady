const db = require('../db/connection');
const { mapAgeToExperienceMode } = require('./authService');

// Reuses the existing rank tiers as league names, so climbing the same XP
// ladder that drives badges also visibly moves you up a league.
const LEAGUE_NAMES = {
  Novice: 'Bronze League',
  Prepared: 'Silver League',
  Resilient: 'Gold League',
  Guardian: 'Diamond League'
};

function getTopUsers(limit = 10, experienceMode = null) {
  // experienceMode is derived from age (see authService.mapAgeToExperienceMode),
  // not a stored column, so the filter is applied in JS after computing it
  // per row rather than in SQL.
  const rows = db
    .prepare(`
      SELECT g.user_id AS userId, g.points, g.rank, u.username, u.age
      FROM gamification_state g
      JOIN users u ON u.id = g.user_id
      ORDER BY g.points DESC
    `)
    .all();

  let combined = rows.map((r) => ({
    userId: r.userId,
    username: r.username,
    experienceMode: r.age != null ? mapAgeToExperienceMode(r.age) : null,
    points: r.points,
    rank: r.rank,
    league: LEAGUE_NAMES[r.rank] || 'Bronze League'
  }));

  if (experienceMode) {
    combined = combined.filter((c) => c.experienceMode === experienceMode);
  }

  return combined.slice(0, limit);
}

module.exports = { getTopUsers, LEAGUE_NAMES };
