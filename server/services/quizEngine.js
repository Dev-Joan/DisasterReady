const LOWER = 0.6;
const UPPER = 0.9;
const WINDOW_SIZE = 5;

function initTopicState() {
  return { history: [], currentDifficulty: 1, mastered: false };
}

function rollingAccuracy(userState, topic) {
  const t = userState[topic];
  if (!t || t.history.length === 0) return null;
  const correctCount = t.history.filter(r => r === true).length;
  return correctCount / t.history.length;
}

function recordAnswer(userState, topic, wasCorrect) {
  if (!userState[topic]) userState[topic] = initTopicState();
  const t = userState[topic];

  t.history.push(wasCorrect);
  if (t.history.length > WINDOW_SIZE) t.history.shift();

  updateDifficulty(userState, topic);
}

function updateDifficulty(userState, topic) {
  const t = userState[topic];
  const acc = rollingAccuracy(userState, topic);
  if (acc === null || t.history.length < 3) return;

  if (acc < LOWER) {
    t.currentDifficulty = Math.max(1, t.currentDifficulty - 1);
  } else if (acc > UPPER) {
    t.currentDifficulty = Math.min(3, t.currentDifficulty + 1);
    if (t.currentDifficulty === 3 && acc >= 0.9) {
      t.mastered = true;
    }
  }
}

function pickQuestion(questionBank, topic, difficulty, seenQuestionIds) {
  const candidates = questionBank.filter(
    q => q.topic === topic && q.difficulty === difficulty && !seenQuestionIds.includes(q.questionId)
  );

  if (candidates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

module.exports = {
  initTopicState,
  rollingAccuracy,
  recordAnswer,
  updateDifficulty,
  pickQuestion,
  LOWER,
  UPPER
};