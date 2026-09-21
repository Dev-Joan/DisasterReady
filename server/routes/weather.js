const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const weatherService = require('../services/weatherService');

const getUserStmt = db.prepare('SELECT country FROM users WHERE id = ?');

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = getUserStmt.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const weather = await weatherService.getWeatherForCountry(user.country || 'default');
    res.status(200).json({ country: user.country || 'default', ...weather });
  } catch (err) {
    // Only reached when there is truly nothing to serve — no live data AND
    // no cache. A genuine "weather is currently unavailable", not a client error.
    res.status(503).json({ error: err.message });
  }
});

module.exports = router;
