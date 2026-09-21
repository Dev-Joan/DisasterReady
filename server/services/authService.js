const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { computeAccessibilityProfile } = require('./accessibilityEngine');

function mapAgeToExperienceMode(age) {
  if (age >= 5 && age <= 12) return 'child';
  if (age >= 13 && age <= 24) return 'teen';
  if (age >= 25 && age <= 49) return 'adult';
  if (age >= 50) return 'elderly';
  return 'adult';
}

const countryHazardMap = {
  'Lebanon': ['earthquake', 'flood', 'wildfire'],
  'UAE': ['severe_weather', 'flood'],
  'Saudi Arabia': ['flood', 'severe_weather'],
  'Egypt': ['flood', 'earthquake'],
  'South Africa': ['flood', 'wildfire'],
  'UK': ['flood', 'severe_weather'],
  'France': ['flood', 'severe_weather', 'wildfire'],
  'Germany': ['flood', 'severe_weather'],
  'Italy': ['earthquake', 'flood'],
  'Greece': ['earthquake', 'wildfire'],
  'Japan': ['earthquake', 'flood', 'severe_weather'],
  'India': ['flood', 'severe_weather', 'earthquake'],
  'Philippines': ['severe_weather', 'flood', 'earthquake'],
  'Indonesia': ['earthquake', 'flood'],
  'China': ['flood', 'earthquake'],
  'US': ['earthquake', 'flood', 'severe_weather', 'wildfire'],
  'Canada': ['wildfire', 'flood', 'severe_weather'],
  'Mexico': ['earthquake', 'severe_weather'],
  'Brazil': ['flood', 'severe_weather'],
  'Argentina': ['flood', 'severe_weather'],
  'default': ['earthquake', 'flood']
};

function mapCountryToHazards(country) {
  return countryHazardMap[country] || countryHazardMap['default'];
}

// Kept under its old name for backward compatibility (routes/onboarding.js
// imports this symbol) — it delegates to the shared, rule-based
// accessibility engine (services/accessibilityEngine.js) instead of its own
// ad hoc if-flag-then-set-boolean mapping, so signup and onboarding always
// compute the exact same profile from the same flags.
const mapAccessibilityFlags = computeAccessibilityProfile;

const insertUserStmt = db.prepare(`
  INSERT INTO users (id, username, password_hash, name, age, region, country)
  VALUES (@id, @username, @password_hash, @name, @age, @region, @country)
`);
const insertFlagStmt = db.prepare('INSERT INTO user_accessibility_flags (user_id, flag) VALUES (?, ?)');
const insertGamificationStmt = db.prepare('INSERT INTO gamification_state (user_id) VALUES (?)');
const findUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');

// Signup writes three related things (the user row, their accessibility
// flags, and their initial gamification row) that must all succeed or all
// fail together — a partially-created account with no gamification row
// would break the very next request. Wrapped in one transaction so a
// failure partway through (e.g. a bad flag value) leaves nothing behind.
const createUserAndDefaults = db.transaction(({ id, username, passwordHash, name, age, region, country, accessibilityFlags }) => {
  insertUserStmt.run({ id, username, password_hash: passwordHash, name: name || null, age: age ?? null, region: region || null, country: country || null });
  for (const flag of accessibilityFlags || []) insertFlagStmt.run(id, flag);
  insertGamificationStmt.run(id);
});

function signup({ username, password, name, age, region, country, accessibilityFlags }) {
  if (findUserByUsernameStmt.get(username)) {
    throw new Error('Username already taken');
  }

  const userId = 'u_' + Date.now();
  const passwordHash = bcrypt.hashSync(password, 10);

  createUserAndDefaults({ id: userId, username, passwordHash, name, age, region, country, accessibilityFlags });

  return { userId, username, experienceMode: mapAgeToExperienceMode(age) };
}

function login(username, password) {
  const user = findUserByUsernameStmt.get(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatches) {
    throw new Error('Invalid username or password');
  }

  return { userId: user.id, username: user.username, experienceMode: user.age != null ? mapAgeToExperienceMode(user.age) : null };
}

module.exports = { signup, login, mapAccessibilityFlags, mapAgeToExperienceMode, mapCountryToHazards };
