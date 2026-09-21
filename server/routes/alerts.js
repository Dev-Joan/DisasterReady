const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const advisoryEngine = require('../services/advisoryEngine');
const advisorySummarizer = require('../services/advisorySummarizer');
const { mapAgeToExperienceMode } = require('../services/authService');

const getUserStmt = db.prepare('SELECT country, age FROM users WHERE id = ?');

// Resolves the user's country server-side (mirroring routes/weather.js)
// rather than trusting the client to pass the right key — the previous
// version of this route took a raw `region` query param, but one caller
// (AlertsScreen) passed the signup region bucket ('MEA'/'Europe'/...) while
// another (HomeScreen) passed the country ('Lebanon'/'UK'/...), and only
// the latter ever actually matched anything. Resolving from userId removes
// that whole class of mismatch.
router.get('/active', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const experienceMode = user.age != null ? mapAgeToExperienceMode(user.age) : 'adult';
  const result = await advisoryEngine.getAdvisoriesForCountry(user.country || 'default');

  // Profile-aware rewrite per active advisory (see advisorySummarizer.js for
  // the full design: constrained/grounded LLM rewrite, validated against a
  // per-hazard safety-keyword contract, falling back to the original,
  // unmodified text on any validation failure or rewrite error). Run in
  // parallel since each is an independent LLM call.
  const alerts = await Promise.all(
    result.alerts.map(async (alert) => {
      const adapted = await advisorySummarizer.adaptAdvisoryForProfile(alert, experienceMode);
      return {
        ...alert,
        message: adapted.originalText,       // always the original, unmodified advisory text
        adaptedMessage: adapted.adaptedText,  // profile-adapted text — safe to display as-is (falls back to original on any failure)
        wasAdapted: adapted.wasAdapted,
        validationPassed: adapted.validationPassed,
        fallbackReason: adapted.fallbackReason
      };
    })
  );

  res.status(200).json({ ...result, alerts, experienceMode });
});

module.exports = router;
