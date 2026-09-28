const DEFAULT_PARAMS = Object.freeze({
  pL0: 0.30,
  pTransit: 0.15,
  pGuess: 0.20,
  pSlip: 0.10
});
const SKILL_PARAMS = Object.freeze({
  earthquake: Object.freeze({
    pL0: 0.30,
    pTransit: 0.15,
    pGuess: 0.22,
    pSlip: 0.10
  }),
  flood: Object.freeze({
    pL0: 0.35,
    pTransit: 0.18,
    pGuess: 0.20,
    pSlip: 0.08
  }),
  wildfire: Object.freeze({
    pL0: 0.25,
    pTransit: 0.16,
    pGuess: 0.22,
    pSlip: 0.10
  }),
  severe_weather: Object.freeze({
    pL0: 0.30,
    pTransit: 0.17,
    pGuess: 0.25,
    pSlip: 0.10
  }),
  general_prep: Object.freeze({
    pL0: 0.35,
    pTransit: 0.18,
    pGuess: 0.20,
    pSlip: 0.08
  })
});
const MASTERY_THRESHOLD = 0.95;
const DIFFICULTY_BANDS = Object.freeze({
  easyBelow: 0.4,
  hardAtOrAbove: 0.75
});
function getSkillParams(skill) {
  return SKILL_PARAMS[skill] || DEFAULT_PARAMS;
}
function posteriorMastery(pMasteryPrior, wasCorrect, params) {
  const {
    pGuess,
    pSlip
  } = params;
  const pL = pMasteryPrior;
  if (wasCorrect) {
    const numerator = (1 - pSlip) * pL;
    const denominator = numerator + pGuess * (1 - pL);
    return numerator / denominator;
  }
  const numerator = pSlip * pL;
  const denominator = numerator + (1 - pGuess) * (1 - pL);
  return numerator / denominator;
}
function applyLearningTransition(pMasteryPosterior, params) {
  const {
    pTransit
  } = params;
  return pMasteryPosterior + (1 - pMasteryPosterior) * pTransit;
}
function updateMastery(pMasteryPrior, wasCorrect, params) {
  const posterior = posteriorMastery(pMasteryPrior, wasCorrect, params);
  const pMasteryNext = applyLearningTransition(posterior, params);
  return {
    posterior,
    pMasteryNext
  };
}
function difficultyForMastery(pMastery) {
  if (pMastery < DIFFICULTY_BANDS.easyBelow) return 1;
  if (pMastery < DIFFICULTY_BANDS.hardAtOrAbove) return 2;
  return 3;
}
const HISTORY_CAP = 50;
function initSkillState(skill) {
  const params = getSkillParams(skill);
  return {
    pMastery: params.pL0,
    attempts: 0,
    correctCount: 0,
    mastered: params.pL0 >= MASTERY_THRESHOLD,
    history: []
  };
}
function recordAnswer(userState, skill, wasCorrect) {
  if (!userState[skill]) userState[skill] = initSkillState(skill);
  const state = userState[skill];
  const params = getSkillParams(skill);
  const pBefore = state.pMastery;
  const {
    posterior,
    pMasteryNext
  } = updateMastery(pBefore, wasCorrect, params);
  state.attempts += 1;
  if (wasCorrect) state.correctCount += 1;
  state.pMastery = pMasteryNext;
  state.mastered = pMasteryNext >= MASTERY_THRESHOLD;
  state.history.push({
    attempt: state.attempts,
    wasCorrect,
    pBefore,
    posterior,
    pAfter: pMasteryNext
  });
  if (state.history.length > HISTORY_CAP) state.history.shift();
  return state;
}
function pickQuestion(questionBank, skill, pMastery, seenQuestionIds) {
  const idealDifficulty = difficultyForMastery(pMastery);
  const tryOrder = [idealDifficulty, idealDifficulty - 1, idealDifficulty + 1].filter(d => d >= 1 && d <= 3);
  for (const difficulty of tryOrder) {
    const candidates = questionBank.filter(q => q.topic === skill && q.difficulty === difficulty && !seenQuestionIds.includes(q.questionId));
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  return null;
}
module.exports = {
  DEFAULT_PARAMS,
  SKILL_PARAMS,
  MASTERY_THRESHOLD,
  DIFFICULTY_BANDS,
  getSkillParams,
  posteriorMastery,
  applyLearningTransition,
  updateMastery,
  difficultyForMastery,
  initSkillState,
  recordAnswer,
  pickQuestion
};
