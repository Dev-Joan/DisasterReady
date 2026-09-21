/**
 * ============================================================================
 *  BAYESIAN KNOWLEDGE TRACING (BKT) ENGINE
 * ============================================================================
 *
 * This module replaces the old thresholded-rolling-accuracy heuristic
 * (see `quizEngine.js`, kept in the repo unmodified as a documented
 * baseline/fallback for comparison) as the engine that drives the adaptive
 * quiz's difficulty selection and "mastered" decision.
 *
 * ---------------------------------------------------------------------------
 * 1. THE MODEL
 * ---------------------------------------------------------------------------
 * BKT (Corbett & Anderson, 1995) models a learner's mastery of ONE skill
 * (here, a disaster-preparedness topic such as "earthquake" or "flood") as
 * a two-state Hidden Markov Model observed indirectly through quiz answers:
 *
 *   Hidden state   L ∈ { mastered (L), not-mastered (¬L) }
 *   Observed state O ∈ { correct, incorrect }            (one per question)
 *
 * The learner's TRUE mastery (L) is never observed directly — only whether
 * they answered each question correctly. BKT tracks a belief distribution
 * over the hidden state, P(L), and updates it after every observation.
 *
 * Four parameters fully define the model for a given skill:
 *
 *   P(L0)  Prior knowledge   — probability the learner already knows the
 *                              skill before answering any question at all.
 *   P(T)   Transition/learn  — probability of moving from ¬L to L after one
 *                              practice opportunity (one answered question).
 *                              Classic BKT assumes learning is a one-way
 *                              ratchet: P(forget) = 0, i.e. once mastered,
 *                              mastery is never lost. This is the standard
 *                              simplifying assumption in the literature and
 *                              is what keeps the model identifiable with
 *                              only four parameters.
 *   P(G)   Guess             — probability of answering CORRECTLY despite
 *                              NOT having mastered the skill.
 *   P(S)   Slip              — probability of answering INCORRECTLY despite
 *                              HAVING mastered the skill.
 *
 * ---------------------------------------------------------------------------
 * 2. THE OBSERVATION (EMISSION) MODEL
 * ---------------------------------------------------------------------------
 * Given the hidden mastery state, the chance of each observation is fixed
 * by G and S:
 *
 *   P(correct   | L)  = 1 - P(S)      (mastered, didn't slip)
 *   P(incorrect | L)  = P(S)          (mastered, but slipped)
 *   P(correct   | ¬L) = P(G)          (not mastered, got lucky)
 *   P(incorrect | ¬L) = 1 - P(G)      (not mastered, no guess luck)
 *
 * ---------------------------------------------------------------------------
 * 3. THE BAYESIAN UPDATE (posterior given the answer just observed)
 * ---------------------------------------------------------------------------
 * Let P(L) be the belief BEFORE this question (the prior for this step).
 * By Bayes' rule, the posterior after observing the answer is:
 *
 *   P(L | correct) = ─────────────────P(correct|L)·P(L)─────────────────
 *                     P(correct|L)·P(L) + P(correct|¬L)·(1-P(L))
 *
 *                  = ──────────(1-P(S))·P(L)──────────
 *                     (1-P(S))·P(L) + P(G)·(1-P(L))
 *
 *   P(L | incorrect) = ─────────────────P(incorrect|L)·P(L)─────────────────
 *                       P(incorrect|L)·P(L) + P(incorrect|¬L)·(1-P(L))
 *
 *                    = ──────────P(S)·P(L)──────────
 *                       P(S)·P(L) + (1-P(G))·(1-P(L))
 *
 * This is a direct application of the discrete Bayes' rule
 * P(A|B) = P(B|A)P(A) / P(B), with P(B) expanded via the law of total
 * probability over the two hidden states {L, ¬L}.
 *
 * ---------------------------------------------------------------------------
 * 4. THE LEARNING TRANSITION (turns the HMM into a *tracing* model)
 * ---------------------------------------------------------------------------
 * The posterior above is the belief about mastery DURING the question just
 * answered. Before the NEXT question, the learner has had one more chance
 * to learn (from working through this question, feedback, etc.), so we
 * advance the belief through the transition model:
 *
 *   P(L_next) = P(L | evidence) + (1 - P(L | evidence)) · P(T)
 *
 * i.e. "probability already mastered, plus probability not-yet-mastered
 * times the chance of crossing over this step." Because P(forget) = 0,
 * mass only ever flows ¬L → L, never L → ¬L — P(L_next) is monotonically
 * non-decreasing over a sequence of attempts, which is the hallmark of
 * classic BKT.
 *
 * ---------------------------------------------------------------------------
 * 5. USING P(MASTERY) TO DRIVE THE QUIZ
 * ---------------------------------------------------------------------------
 * - Question difficulty is selected from the CURRENT P(L) (see
 *   `difficultyForMastery`): low mastery → easy questions, rising mastery →
 *   harder questions. This directly couples the latent estimate to
 *   pedagogy, rather than a rolling-window accuracy proxy.
 * - A skill is declared "mastered" once P(L) crosses `MASTERY_THRESHOLD`
 *   (0.95 by default — the conventional cutoff used in Cognitive Tutor /
 *   Corbett & Anderson-style deployments).
 *
 * ---------------------------------------------------------------------------
 * 6. PARAMETERS: DEFAULTS NOW, FIT-FROM-DATA LATER
 * ---------------------------------------------------------------------------
 * `SKILL_PARAMS` below holds hand-set, literature-typical defaults per
 * skill (P(L0) ~0.3, P(T) ~0.15-0.2, P(G) ~0.2, P(S) ~0.1). The lookup goes
 * through `getSkillParams()` so that, later, these numbers could be
 * replaced by parameters fit from real response data (e.g. via
 * Expectation-Maximisation / Baum-Welch, or brute-force grid search
 * minimising prediction error on held-out attempts) without touching any
 * other part of this module — every function below takes `params` as an
 * explicit argument rather than reading global constants directly.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Per-skill parameters. Replace with data-fit values once enough real
// response sequences have been logged (see section 6 above and the
// `history` array kept in each learner's state for exactly this purpose).
// ---------------------------------------------------------------------------
const DEFAULT_PARAMS = Object.freeze({
  pL0: 0.30,      // prior knowledge
  pTransit: 0.15, // learning rate
  pGuess: 0.20,   // guess
  pSlip: 0.10     // slip
});

const SKILL_PARAMS = Object.freeze({
  earthquake: Object.freeze({ pL0: 0.30, pTransit: 0.15, pGuess: 0.22, pSlip: 0.10 }),
  flood: Object.freeze({ pL0: 0.35, pTransit: 0.18, pGuess: 0.20, pSlip: 0.08 })
});

// The conventional BKT "mastery" cutoff (Corbett & Anderson-style tutors).
const MASTERY_THRESHOLD = 0.95;

// Difficulty band boundaries on P(mastery). Three bands to match the
// existing quizBank's difficulty levels {1, 2, 3}.
const DIFFICULTY_BANDS = Object.freeze({ easyBelow: 0.4, hardAtOrAbove: 0.75 });

function getSkillParams(skill) {
  return SKILL_PARAMS[skill] || DEFAULT_PARAMS;
}

// ---------------------------------------------------------------------------
// PURE MATH — the examinable core. No file I/O, no mutation, so these can
// be unit-tested (and marked, in a viva) in complete isolation.
// ---------------------------------------------------------------------------

/**
 * Bayesian posterior P(L | observation), section 3 above.
 * @param {number} pMasteryPrior - P(L) before this question, in [0,1].
 * @param {boolean} wasCorrect - the observation for this question.
 * @param {{pGuess:number, pSlip:number}} params
 * @returns {number} posterior P(L | observation)
 */
function posteriorMastery(pMasteryPrior, wasCorrect, params) {
  const { pGuess, pSlip } = params;
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

/**
 * Learning transition, section 4 above: advances the posterior through one
 * step of the (forget-free) transition model to give the prior for the
 * NEXT question.
 * @param {number} pMasteryPosterior - P(L | observation) just computed.
 * @param {{pTransit:number}} params
 * @returns {number} P(L_next)
 */
function applyLearningTransition(pMasteryPosterior, params) {
  const { pTransit } = params;
  return pMasteryPosterior + (1 - pMasteryPosterior) * pTransit;
}

/**
 * One full BKT step: Bayesian update followed by the learning transition.
 * Returns both intermediate values so callers (and the test harness) can
 * print the full trajectory, not just the final number.
 * @param {number} pMasteryPrior
 * @param {boolean} wasCorrect
 * @param {{pGuess:number, pSlip:number, pTransit:number}} params
 */
function updateMastery(pMasteryPrior, wasCorrect, params) {
  const posterior = posteriorMastery(pMasteryPrior, wasCorrect, params);
  const pMasteryNext = applyLearningTransition(posterior, params);
  return { posterior, pMasteryNext };
}

/**
 * Maps the current P(mastery) onto one of the quiz bank's three difficulty
 * levels. This is what "P(mastery) drives question selection" means in
 * practice: the harder the learner is estimated to already be, the harder
 * the next question they are shown.
 */
function difficultyForMastery(pMastery) {
  if (pMastery < DIFFICULTY_BANDS.easyBelow) return 1;
  if (pMastery < DIFFICULTY_BANDS.hardAtOrAbove) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// STATE — per user, per skill. Shape:
//   { pMastery, attempts, correctCount, mastered, history: [...] }
// `history` retains a bounded trailing log of each attempt's before/after
// values purely for transparency (and as the raw material a future
// parameter-fitting pass would need) — it plays no role in the maths above.
// ---------------------------------------------------------------------------

const HISTORY_CAP = 50;

function initSkillState(skill) {
  const params = getSkillParams(skill);
  return {
    pMastery: params.pL0, // P(L0): before any evidence, the prior IS P(L0).
    attempts: 0,
    correctCount: 0,
    mastered: params.pL0 >= MASTERY_THRESHOLD,
    history: []
  };
}

/**
 * Mutates `userState[skill]` in place with the result of one answered
 * question, and returns the updated skill state for convenience.
 */
function recordAnswer(userState, skill, wasCorrect) {
  if (!userState[skill]) userState[skill] = initSkillState(skill);
  const state = userState[skill];
  const params = getSkillParams(skill);

  const pBefore = state.pMastery;
  const { posterior, pMasteryNext } = updateMastery(pBefore, wasCorrect, params);

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

/**
 * Picks a random, not-yet-seen question from the bank at the difficulty
 * implied by the learner's current P(mastery) for this skill. Falls back
 * to the two neighbouring bands if the ideal band has no fresh questions
 * left, so the quiz doesn't dead-end just because one band is exhausted.
 */
function pickQuestion(questionBank, skill, pMastery, seenQuestionIds) {
  const idealDifficulty = difficultyForMastery(pMastery);
  const tryOrder = [idealDifficulty, idealDifficulty - 1, idealDifficulty + 1].filter(
    (d) => d >= 1 && d <= 3
  );

  for (const difficulty of tryOrder) {
    const candidates = questionBank.filter(
      (q) => q.topic === skill && q.difficulty === difficulty && !seenQuestionIds.includes(q.questionId)
    );
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  return null;
}

module.exports = {
  // parameters
  DEFAULT_PARAMS,
  SKILL_PARAMS,
  MASTERY_THRESHOLD,
  DIFFICULTY_BANDS,
  getSkillParams,
  // pure math
  posteriorMastery,
  applyLearningTransition,
  updateMastery,
  difficultyForMastery,
  // state
  initSkillState,
  recordAnswer,
  pickQuestion
};
