const express = require('express');
const app = express();

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const onboardingRoutes = require('./routes/onboarding');
app.use('/onboarding', onboardingRoutes);

const quizRoutes = require('./routes/quiz');
app.use('/quiz', quizRoutes);

const gamificationRoutes = require('./routes/gamification');
app.use('/gamification', gamificationRoutes);

const chatbotRoutes = require('./routes/chatbot');
app.use('/chatbot', chatbotRoutes);

const alertsRoutes = require('./routes/alerts');
app.use('/alerts', alertsRoutes);

const leaderboardRoutes = require('./routes/leaderboard');
app.use('/leaderboard', leaderboardRoutes);

const weatherRoutes = require('./routes/weather');
app.use('/weather', weatherRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DisasterReady server running on port ${PORT}`);
});