const db = require('../db/connection');
const {
  mapAgeToExperienceMode
} = require('./authService');
const LEAGUE_NAMES = {
  Novice: 'Bronze League',
  Prepared: 'Silver League',
  Resilient: 'Gold League',
  Guardian: 'Diamond League'
};
function getTopUsers(limit = 10, experienceMode = null) {
  const rows = db.prepare(`
      SELECT g.user_id AS userId, g.points, g.rank, u.username, u.age
      FROM gamification_state g
      JOIN users u ON u.id = g.user_id
      ORDER BY g.points DESC, g.user_id ASC
    `).all();
  let combined = rows.map(r => ({
    userId: r.userId,
    username: r.username,
    experienceMode: r.age != null ? mapAgeToExperienceMode(r.age) : null,
    points: r.points,
    rank: r.rank,
    league: LEAGUE_NAMES[r.rank] || 'Bronze League'
  }));
  if (experienceMode) {
    combined = combined.filter(c => c.experienceMode === experienceMode);
  }
  return combined.slice(0, limit);
}
module.exports = {
  getTopUsers,
  LEAGUE_NAMES
};
