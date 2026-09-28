const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const {
  mapAgeToExperienceMode,
  mapCountryToHazards,
  mapAccessibilityFlags
} = require('../services/authService');
const getUserStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const getFlagsStmt = db.prepare('SELECT flag FROM user_accessibility_flags WHERE user_id = ?');
const updateThemeStmt = db.prepare('UPDATE users SET theme = ? WHERE id = ?');
const updateNotificationsStmt = db.prepare('UPDATE users SET notifications_enabled = ? WHERE id = ?');
const updateProfileStmt = db.prepare(`
  UPDATE users SET
    name = COALESCE(@name, name),
    age = COALESCE(@age, age),
    region = COALESCE(@region, region),
    country = COALESCE(@country, country)
  WHERE id = @id
`);
const deleteFlagsStmt = db.prepare('DELETE FROM user_accessibility_flags WHERE user_id = ?');
const insertFlagStmt = db.prepare('INSERT INTO user_accessibility_flags (user_id, flag) VALUES (?, ?)');
function getFlags(userId) {
  return getFlagsStmt.all(userId).map(r => r.flag);
}
const replaceFlags = db.transaction((userId, flags) => {
  deleteFlagsStmt.run(userId);
  for (const flag of flags) insertFlagStmt.run(userId, flag);
});
router.get('/profile', (req, res) => {
  const {
    userId
  } = req.query;
  if (!userId) return res.status(400).json({
    error: 'userId is required'
  });
  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({
    error: 'User not found'
  });
  const flags = getFlags(userId);
  res.status(200).json({
    userId: user.id,
    name: user.name || null,
    age: user.age || null,
    region: user.region || null,
    country: user.country || null,
    experienceMode: user.age != null ? mapAgeToExperienceMode(user.age) : null,
    relevantHazards: user.country ? mapCountryToHazards(user.country) : [],
    accessibilityFlags: flags,
    accessibilitySettings: mapAccessibilityFlags(flags),
    theme: user.theme || 'light',
    notificationsEnabled: !!user.notifications_enabled
  });
});
router.post('/theme', (req, res) => {
  const {
    userId,
    theme
  } = req.body;
  if (!userId || !theme) return res.status(400).json({
    error: 'userId and theme are required'
  });
  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({
    error: 'User not found'
  });
  updateThemeStmt.run(theme, userId);
  res.status(200).json({
    userId,
    theme
  });
});
router.post('/notifications', (req, res) => {
  const {
    userId,
    enabled
  } = req.body;
  if (!userId || typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'userId and enabled (boolean) are required'
    });
  }
  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({
    error: 'User not found'
  });
  updateNotificationsStmt.run(enabled ? 1 : 0, userId);
  res.status(200).json({
    userId,
    notificationsEnabled: enabled
  });
});
router.post('/update-profile', (req, res) => {
  const {
    userId,
    name,
    age,
    region,
    country
  } = req.body;
  if (!userId) return res.status(400).json({
    error: 'userId is required'
  });
  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({
    error: 'User not found'
  });
  let ageNum = null;
  if (age !== undefined) {
    ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 5) {
      return res.status(400).json({
        error: 'age must be a number of 5 or older'
      });
    }
  }
  updateProfileStmt.run({
    id: userId,
    name: typeof name === 'string' && name.trim() ? name.trim() : null,
    age: ageNum,
    region: typeof region === 'string' && region.trim() ? region.trim() : null,
    country: typeof country === 'string' && country.trim() ? country.trim() : null
  });
  const updated = getUserStmt.get(userId);
  res.status(200).json({
    userId,
    name: updated.name,
    age: updated.age,
    region: updated.region,
    country: updated.country,
    experienceMode: updated.age != null ? mapAgeToExperienceMode(updated.age) : null,
    relevantHazards: updated.country ? mapCountryToHazards(updated.country) : []
  });
});
router.post('/accessibility', (req, res) => {
  const {
    userId,
    accessibilityFlags
  } = req.body;
  if (!userId || !Array.isArray(accessibilityFlags)) {
    return res.status(400).json({
      error: 'userId and accessibilityFlags (array) are required'
    });
  }
  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({
    error: 'User not found'
  });
  replaceFlags(userId, accessibilityFlags);
  res.status(200).json({
    userId,
    accessibilityFlags,
    accessibilitySettings: mapAccessibilityFlags(accessibilityFlags)
  });
});
module.exports = router;
