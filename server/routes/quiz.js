const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const quizEngine = require('../services/quizEngine'); // legacy thresholded-rolling-accuracy baseline — kept for comparison, not deleted
const bktEngine = require('../services/bktEngine'); // Bayesian Knowledge Tracing — the live default engine
const gamificationEngine = require('../services/gamificationEngine');

// `?engine=legacy` (GET) or `{ "engine": "legacy" }` (POST body) opts into
// the old rolling-accuracy heuristic for direct comparison against BKT.
// Anything else (including no engine specified) uses BKT, the new default.
function resolveEngine(requestedEngine) {
  return requestedEngine === 'legacy' ? 'legacy' : 'bkt';
}

const userExistsStmt = db.prepare('SELECT 1 FROM users WHERE id = ?');

const getAllQuestionsStmt = db.prepare(`
  SELECT question_id AS questionId, topic, difficulty, text, correct_answer AS correctAnswer, explanation FROM quiz_questions
`);
function loadQuizBank() {
  return getAllQuestionsStmt.all();
}

// ----------------------------------------------------------------------------
// LEGACY ENGINE — persistence adapter. The pure functions in quizEngine.js
// (recordAnswer, rollingAccuracy, pickQuestion) are untouched: they operate
// on the same in-memory `{ history, currentDifficulty, mastered }` shape
// they always did. Only how that shape is loaded from and saved to
// persistent storage changes here, from a JSON file to SQL.
// ----------------------------------------------------------------------------

const getLegacyStateStmt = db.prepare('SELECT current_difficulty AS currentDifficulty, mastered FROM legacy_quiz_state WHERE user_id = ? AND topic = ?');
const insertLegacyStateDefaultStmt = db.prepare('INSERT OR IGNORE INTO legacy_quiz_state (user_id, topic, current_difficulty, mastered) VALUES (?, ?, 1, 0)');
// `recordAnswer`'s rolling accuracy depends on the actual last-5 values, not
// just a count, so the trailing window is loaded in chronological order.
const getLegacyRecentHistoryStmt = db.prepare(`
  SELECT was_correct AS wasCorrect FROM (
    SELECT was_correct, attempt_number FROM legacy_quiz_answer_history
    WHERE user_id = ? AND topic = ? ORDER BY attempt_number DESC LIMIT 5
  ) ORDER BY attempt_number ASC
`);
const getLegacyMaxAttemptStmt = db.prepare('SELECT COALESCE(MAX(attempt_number), 0) AS maxAttempt FROM legacy_quiz_answer_history WHERE user_id = ? AND topic = ?');
const updateLegacyStateStmt = db.prepare('UPDATE legacy_quiz_state SET current_difficulty = ?, mastered = ? WHERE user_id = ? AND topic = ?');
const insertLegacyHistoryStmt = db.prepare('INSERT INTO legacy_quiz_answer_history (user_id, topic, attempt_number, was_correct) VALUES (?, ?, ?, ?)');

function ensureLegacyTopic(userId, topic) {
  insertLegacyStateDefaultStmt.run(userId, topic);
  const row = getLegacyStateStmt.get(userId, topic);
  return { currentDifficulty: row.currentDifficulty, mastered: Boolean(row.mastered), history: getLegacyRecentHistoryStmt.all(userId, topic).map((r) => Boolean(r.wasCorrect)) };
}

// recordAnswer + the resulting state/history writes are one logical step —
// an answer that updated difficulty but didn't get logged (or vice versa)
// would desync the rolling-accuracy window from what actually happened.
const saveLegacyAnswerTx = db.transaction((userId, topic, topicState, wasCorrect) => {
  updateLegacyStateStmt.run(topicState.currentDifficulty, topicState.mastered ? 1 : 0, userId, topic);
  const nextAttempt = getLegacyMaxAttemptStmt.get(userId, topic).maxAttempt + 1;
  insertLegacyHistoryStmt.run(userId, topic, nextAttempt, wasCorrect ? 1 : 0);
});

// ----------------------------------------------------------------------------
// BKT ENGINE — persistence adapter. Same principle: bktEngine.js's pure
// Bayesian update math (recordAnswer, difficultyForMastery, pickQuestion,
// getSkillParams) is untouched.
// ----------------------------------------------------------------------------

const getBktStateStmt = db.prepare('SELECT p_mastery AS pMastery, attempts, correct_count AS correctCount, mastered FROM bkt_state WHERE user_id = ? AND skill = ?');
const insertBktStateDefaultStmt = db.prepare('INSERT OR IGNORE INTO bkt_state (user_id, skill, p_mastery, attempts, correct_count, mastered) VALUES (?, ?, ?, 0, 0, 0)');
const getBktMaxAttemptStmt = db.prepare('SELECT COALESCE(MAX(attempt_number), 0) AS maxAttempt FROM bkt_answer_history WHERE user_id = ? AND skill = ?');
const updateBktStateStmt = db.prepare('UPDATE bkt_state SET p_mastery = ?, attempts = ?, correct_count = ?, mastered = ? WHERE user_id = ? AND skill = ?');
const insertBktHistoryStmt = db.prepare(`
  INSERT INTO bkt_answer_history (user_id, skill, attempt_number, was_correct, p_before, posterior, p_after)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function ensureBktSkill(userId, skill) {
  insertBktStateDefaultStmt.run(userId, skill, bktEngine.getSkillParams(skill).pL0);
  const row = getBktStateStmt.get(userId, skill);
  // `history` isn't loaded from the DB here — the pure math (pMastery,
  // attempts, correctCount) never reads past entries to compute anything,
  // it only appends one new entry per call, so an empty in-memory array is
  // enough; the appended entry is what gets persisted below.
  return { pMastery: row.pMastery, attempts: row.attempts, correctCount: row.correctCount, mastered: Boolean(row.mastered), history: [] };
}

// recordAnswer's state update and its one new history row are one action.
const saveBktAnswerTx = db.transaction((userId, skill, skillState) => {
  updateBktStateStmt.run(skillState.pMastery, skillState.attempts, skillState.correctCount, skillState.mastered ? 1 : 0, userId, skill);
  const entry = skillState.history[skillState.history.length - 1];
  const nextAttempt = getBktMaxAttemptStmt.get(userId, skill).maxAttempt + 1;
  insertBktHistoryStmt.run(userId, skill, nextAttempt, entry.wasCorrect ? 1 : 0, entry.pBefore, entry.posterior, entry.pAfter);
});

router.get('/next-question', (req, res) => {
  const { userId, topic } = req.query;
  const engine = resolveEngine(req.query.engine);

  if (!userId || !topic) {
    return res.status(400).json({ error: 'userId and topic are required' });
  }
  if (!userExistsStmt.get(userId)) return res.status(404).json({ error: 'User not found' });

  const questionBank = loadQuizBank();
  const seenQuestionIds = [];

  if (engine === 'legacy') {
    const topicState = ensureLegacyTopic(userId, topic);
    const question = quizEngine.pickQuestion(questionBank, topic, topicState.currentDifficulty, seenQuestionIds);

    if (!question) {
      return res.status(200).json({ engine, message: 'No more questions available', mastered: topicState.mastered });
    }
    return res.status(200).json({
      engine,
      questionId: question.questionId,
      text: question.text,
      difficulty: question.difficulty,
      mastered: topicState.mastered
    });
  }

  // --- BKT (default) ---
  const skillState = ensureBktSkill(userId, topic);
  const question = bktEngine.pickQuestion(questionBank, topic, skillState.pMastery, seenQuestionIds);

  if (!question) {
    return res.status(200).json({ engine, message: 'No more questions available', mastered: skillState.mastered, pMastery: skillState.pMastery });
  }
  res.status(200).json({
    engine,
    questionId: question.questionId,
    text: question.text,
    difficulty: question.difficulty,
    mastered: skillState.mastered,
    pMastery: skillState.pMastery
  });
});

router.post('/answer', (req, res) => {
  const { userId, topic, wasCorrect } = req.body;
  const engine = resolveEngine(req.body.engine);

  if (!userId || !topic || wasCorrect === undefined) {
    return res.status(400).json({ error: 'userId, topic, and wasCorrect are required' });
  }
  if (!userExistsStmt.get(userId)) return res.status(404).json({ error: 'User not found' });

  if (engine === 'legacy') {
    const topicState = ensureLegacyTopic(userId, topic);
    const wasAlreadyMastered = topicState.mastered;

    const userState = { [topic]: topicState };
    quizEngine.recordAnswer(userState, topic, wasCorrect);
    saveLegacyAnswerTx(userId, topic, userState[topic], wasCorrect);

    const pointsForThisAnswer = wasCorrect ? (userState[topic].currentDifficulty * 5) : 0;
    let gamificationResult = null;
    if (pointsForThisAnswer > 0) gamificationResult = gamificationEngine.awardPoints(userId, pointsForThisAnswer);
    if (userState[topic].mastered && !wasAlreadyMastered) {
      gamificationResult = gamificationEngine.awardTopicMasteryBadge(userId, topic);
    }

    return res.status(200).json({
      engine,
      newDifficulty: userState[topic].currentDifficulty,
      accuracy: quizEngine.rollingAccuracy(userState, topic),
      mastered: userState[topic].mastered,
      gamification: gamificationResult
    });
  }

  // --- BKT (default) ---
  const skillState = ensureBktSkill(userId, topic);
  const wasAlreadyMastered = skillState.mastered;

  // Difficulty of the question just answered is derived from P(mastery)
  // BEFORE this update, so points reflect what they actually attempted.
  const pBefore = skillState.pMastery;
  const difficultyJustAnswered = bktEngine.difficultyForMastery(pBefore);

  const userState = { [topic]: skillState };
  const updatedSkillState = bktEngine.recordAnswer(userState, topic, wasCorrect);
  saveBktAnswerTx(userId, topic, updatedSkillState);

  const pointsForThisAnswer = wasCorrect ? (difficultyJustAnswered * 5) : 0;
  let gamificationResult = null;
  if (pointsForThisAnswer > 0) gamificationResult = gamificationEngine.awardPoints(userId, pointsForThisAnswer);
  if (updatedSkillState.mastered && !wasAlreadyMastered) {
    gamificationResult = gamificationEngine.awardTopicMasteryBadge(userId, topic);
  }

  res.status(200).json({
    engine,
    newDifficulty: bktEngine.difficultyForMastery(updatedSkillState.pMastery),
    accuracy: updatedSkillState.attempts > 0 ? updatedSkillState.correctCount / updatedSkillState.attempts : null,
    pMastery: updatedSkillState.pMastery,
    mastered: updatedSkillState.mastered,
    gamification: gamificationResult
  });
});

module.exports = router;
