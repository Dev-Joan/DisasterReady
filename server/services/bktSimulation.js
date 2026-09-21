/**
 * ============================================================================
 *  BKT STANDALONE TEST HARNESS / SIMULATION
 * ============================================================================
 * Runs a set of hand-crafted, simulated learner response sequences through
 * the PURE math functions in `bktEngine.js` (no Express, no file I/O, no
 * shared server state) and prints the P(mastery) trajectory step by step —
 * before the Bayesian update, the posterior immediately after it, and the
 * value after the learning-transition step — so the evolution of the
 * latent mastery estimate can be inspected and quoted directly as
 * evaluation evidence (e.g. in a report or viva).
 *
 * Run with:
 *   node services/bktSimulation.js
 * from the `server` directory (or `node server/services/bktSimulation.js`
 * from the repo root).
 * ============================================================================
 */

const { updateMastery, difficultyForMastery, getSkillParams, MASTERY_THRESHOLD } = require('./bktEngine');

// ---------------------------------------------------------------------------
// Simulated response sequences. `true` = correct, `false` = incorrect.
// Each is a plausible, hand-picked story a marker can sanity-check by eye.
// ---------------------------------------------------------------------------
const SCENARIOS = [
  {
    name: 'Fast learner (earthquake)',
    skill: 'earthquake',
    description: 'Struggles briefly, then locks in the skill and stays consistent.',
    sequence: [false, false, true, true, true, true, true, true]
  },
  {
    name: 'Struggling learner (earthquake)',
    skill: 'earthquake',
    description: 'Mostly incorrect throughout — mastery should stay low.',
    sequence: [false, false, true, false, false, true, false, false]
  },
  {
    name: 'Already knew it (flood)',
    skill: 'flood',
    description: 'Correct from the very first question — should cross the mastery threshold fast.',
    sequence: [true, true, true, true]
  },
  {
    name: 'Lucky guesser, not actually mastered (flood)',
    skill: 'flood',
    description: 'Two early correct answers "by guess", then reveals true (lower) ability.',
    sequence: [true, true, false, false, false, false]
  },
  {
    name: 'Slip-prone but mastered (earthquake)',
    skill: 'earthquake',
    description: 'Gets it right consistently enough to master, then a couple of careless slips — mastery should NOT collapse from a slip alone.',
    sequence: [true, true, true, true, true, false, true, false, true]
  }
];

function runScenario(scenario) {
  const params = getSkillParams(scenario.skill);

  console.log('='.repeat(78));
  console.log(`SCENARIO: ${scenario.name}`);
  console.log(`Skill: ${scenario.skill}  |  ${scenario.description}`);
  console.log(
    `Parameters -> P(L0)=${params.pL0}  P(T)=${params.pTransit}  P(G)=${params.pGuess}  P(S)=${params.pSlip}  |  mastery threshold=${MASTERY_THRESHOLD}`
  );
  console.log('-'.repeat(78));
  console.log(
    padRow(['#', 'answer', 'P(L) before', 'posterior', 'P(L) after', 'difficulty', 'mastered?'])
  );

  let pMastery = params.pL0;
  let masteredAt = null;

  scenario.sequence.forEach((wasCorrect, i) => {
    const pBefore = pMastery;
    const { posterior, pMasteryNext } = updateMastery(pBefore, wasCorrect, params);
    pMastery = pMasteryNext;

    const justMastered = pMastery >= MASTERY_THRESHOLD;
    if (justMastered && masteredAt === null) masteredAt = i + 1;

    console.log(
      padRow([
        String(i + 1),
        wasCorrect ? 'correct' : 'incorrect',
        pBefore.toFixed(4),
        posterior.toFixed(4),
        pMastery.toFixed(4),
        String(difficultyForMastery(pBefore)),
        justMastered ? 'YES' : ''
      ])
    );
  });

  console.log('-'.repeat(78));
  console.log(
    masteredAt
      ? `Result: crossed mastery threshold (${MASTERY_THRESHOLD}) after attempt #${masteredAt}. Final P(L) = ${pMastery.toFixed(4)}`
      : `Result: did NOT cross mastery threshold (${MASTERY_THRESHOLD}) in ${scenario.sequence.length} attempts. Final P(L) = ${pMastery.toFixed(4)}`
  );
  console.log('');
}

function padRow(cells) {
  const widths = [4, 10, 13, 11, 12, 11, 10];
  return cells.map((c, i) => c.padEnd(widths[i])).join(' | ');
}

function main() {
  console.log('\nBAYESIAN KNOWLEDGE TRACING — SIMULATION TEST HARNESS\n');
  SCENARIOS.forEach(runScenario);
}

main();
