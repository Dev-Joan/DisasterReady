const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/signup', (req, res) => {
  const { username, password, name, age, region, country, accessibilityFlags } = req.body;

  if (!username || !password || !name || age === undefined || !region || !country) {
    return res.status(400).json({ error: 'username, password, name, age, region, and country are required' });
  }

  try {
    const user = authService.signup({ username, password, name, age: parseInt(age, 10), region, country, accessibilityFlags });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = authService.login(username, password);
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;