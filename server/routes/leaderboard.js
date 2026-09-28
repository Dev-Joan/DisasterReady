const express = require('express');
const router = express.Router();
const leaderboardService = require('../services/leaderboardService');
router.get('/top', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const mode = req.query.mode || null;
  const topUsers = leaderboardService.getTopUsers(limit, mode);
  res.status(200).json({
    leaderboard: topUsers
  });
});
module.exports = router;
