const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const advisoryEngine = require('../services/advisoryEngine');
const advisorySummarizer = require('../services/advisorySummarizer');
const {
  mapAgeToExperienceMode
} = require('../services/authService');
const getUserStmt = db.prepare('SELECT country, age FROM users WHERE id = ?');
router.get('/active', async (req, res) => {
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
  const experienceMode = user.age != null ? mapAgeToExperienceMode(user.age) : 'adult';
  const result = await advisoryEngine.getAdvisoriesForCountry(user.country || 'default');
  const alerts = await Promise.all(result.alerts.map(async alert => {
    const adapted = await advisorySummarizer.adaptAdvisoryForProfile(alert, experienceMode);
    return {
      ...alert,
      message: adapted.originalText,
      adaptedMessage: adapted.adaptedText,
      wasAdapted: adapted.wasAdapted,
      validationPassed: adapted.validationPassed,
      fallbackReason: adapted.fallbackReason
    };
  }));
  res.status(200).json({
    ...result,
    alerts,
    experienceMode
  });
});
module.exports = router;
