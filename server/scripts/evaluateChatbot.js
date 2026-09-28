const fs = require('fs');
const path = require('path');
const {
  retrieveTopK
} = require('../services/ragService');
const {
  askChatbot,
  OUT_OF_SCOPE_REPLY,
  TOP_K,
  MIN_RELEVANCE_SCORE
} = require('../services/chatbotService');
const testSetPath = path.join(__dirname, '../evaluation/chatbotTestSet.json');
const resultsDir = path.join(__dirname, '../evaluation/results');
const jsonOutPath = path.join(resultsDir, 'chatbotEvalResults.json');
const mdOutPath = path.join(resultsDir, 'chatbotEvalReport.md');
const CORPUS_SIZE_FOR_SUPPRESSION_CHECK = 25;
function truncate(str, len) {
  if (!str) return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len - 1) + '…' : clean;
}
function looksLikeCoverageDisclaimer(reply) {
  return /doesn'?t cover|not cover|don'?t have (any )?information|no information|outside (my|the) (corpus|knowledge)|can'?t find (anything|information)/i.test(reply || '');
}
async function runCase(question, llmAvailable) {
  const retrieved = await retrieveTopK(question, TOP_K);
  const topScore = retrieved.length ? retrieved[0].score : 0;
  const passedThreshold = topScore >= MIN_RELEVANCE_SCORE;
  let reply = null;
  let retrievalFromAsk = null;
  let llmError = null;
  if (llmAvailable) {
    try {
      const result = await askChatbot(question);
      reply = result.reply;
      retrievalFromAsk = result.retrieval;
    } catch (err) {
      llmError = err.message || String(err);
    }
  }
  return {
    retrieved,
    topScore,
    passedThreshold,
    reply,
    retrievalFromAsk,
    llmError
  };
}
async function evaluateInDomain(cases, llmAvailable) {
  const rows = [];
  for (const c of cases) {
    const {
      retrieved,
      topScore,
      reply,
      llmError
    } = await runCase(c.question, llmAvailable);
    const retrievedIds = retrieved.map(r => r.id);
    const rank = retrievedIds.findIndex(id => c.expectedChunkIds.includes(id));
    const hitAtK = rank !== -1;
    const hitAtTop1 = rank === 0;
    rows.push({
      id: c.id,
      question: c.question,
      expectedChunkIds: c.expectedChunkIds,
      topRetrievedId: retrieved[0]?.id || null,
      topRetrievedTitle: retrieved[0]?.title || null,
      topScore: Number(topScore.toFixed(4)),
      rankOfExpected: hitAtK ? rank + 1 : null,
      hitAtK,
      hitAtTop1,
      retrieved: retrieved.map(r => ({
        id: r.id,
        title: r.title,
        score: Number(r.score.toFixed(4))
      })),
      reply,
      llmError
    });
  }
  return rows;
}
async function evaluateOutOfScope(cases, llmAvailable) {
  const rows = [];
  for (const c of cases) {
    const {
      retrieved,
      topScore,
      passedThreshold,
      reply,
      llmError
    } = await runCase(c.question, llmAvailable);
    const correctlySuppressed = !passedThreshold;
    const exactFallbackMatch = reply !== null ? reply.trim() === OUT_OF_SCOPE_REPLY : null;
    rows.push({
      id: c.id,
      question: c.question,
      topRetrievedId: retrieved[0]?.id || null,
      topRetrievedTitle: retrieved[0]?.title || null,
      topScore: Number(topScore.toFixed(4)),
      correctlySuppressed,
      retrieved: retrieved.map(r => ({
        id: r.id,
        title: r.title,
        score: Number(r.score.toFixed(4))
      })),
      reply,
      exactFallbackMatch,
      llmError
    });
  }
  return rows;
}
async function evaluateInScopeUncovered(cases, llmAvailable) {
  const rows = [];
  for (const c of cases) {
    const {
      retrieved,
      topScore,
      passedThreshold,
      reply,
      llmError
    } = await runCase(c.question, llmAvailable);
    const correctlySuppressed = !passedThreshold;
    const avoidedHardFallback = reply !== null ? reply.trim() !== OUT_OF_SCOPE_REPLY : null;
    const disclaimedGap = reply !== null ? looksLikeCoverageDisclaimer(reply) : null;
    rows.push({
      id: c.id,
      question: c.question,
      topRetrievedId: retrieved[0]?.id || null,
      topRetrievedTitle: retrieved[0]?.title || null,
      topScore: Number(topScore.toFixed(4)),
      correctlySuppressed,
      retrieved: retrieved.map(r => ({
        id: r.id,
        title: r.title,
        score: Number(r.score.toFixed(4))
      })),
      reply,
      avoidedHardFallback,
      disclaimedGap,
      llmError
    });
  }
  return rows;
}
function pct(n, d) {
  return d === 0 ? 'n/a' : `${n}/${d} (${(n / d * 100).toFixed(0)}%)`;
}
function printConsoleTable(title, headers, widths, rows) {
  console.log('\n' + '='.repeat(90));
  console.log(title);
  console.log('-'.repeat(90));
  console.log(headers.map((h, i) => h.padEnd(widths[i])).join(' | '));
  rows.forEach(r => console.log(r.map((c, i) => String(c).padEnd(widths[i])).join(' | ')));
}
function buildMarkdown(inDomainRows, outOfScopeRows, uncoveredRows, llmAvailable, summary) {
  const lines = [];
  lines.push('# Chatbot RAG Evaluation Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`LLM generation step: ${llmAvailable ? 'tested (live Anthropic API calls made)' : '**not tested** - ANTHROPIC_API_KEY was missing or invalid, so only the retrieval half of the pipeline was evaluated. Reply/fallback columns are blank.'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Result |');
  lines.push('|---|---|');
  lines.push(`| In-domain: correct chunk retrieved in top-${TOP_K} | ${summary.hitAtK} |`);
  lines.push(`| In-domain: correct chunk retrieved at rank 1 | ${summary.hitAtTop1} |`);
  lines.push(`| In-domain: average top-1 similarity score | ${summary.avgTopScore} |`);
  lines.push(`| Out-of-scope: correctly found nothing relevant (score < ${MIN_RELEVANCE_SCORE}) | ${summary.oosSuppressed} |`);
  if (llmAvailable) {
    lines.push(`| Out-of-scope: exact hard-fallback reply | ${summary.oosFallbackMatch} |`);
  }
  lines.push(`| In-scope-but-uncovered: correctly found nothing relevant (score < ${MIN_RELEVANCE_SCORE}) | ${summary.uncSuppressed} |`);
  if (llmAvailable) {
    lines.push(`| In-scope-but-uncovered: avoided the hard out-of-scope fallback | ${summary.uncAvoidedHardFallback} |`);
    lines.push(`| In-scope-but-uncovered: explicitly disclaimed the corpus gap | ${summary.uncDisclaimedGap} |`);
  }
  lines.push('');
  lines.push('## 1. In-domain test set (retrieval relevance)');
  lines.push('');
  lines.push(`Each question targets one specific corpus passage. "Hit" = that passage appeared in the top-${TOP_K} retrieved chunks.`);
  lines.push('');
  lines.push('| # | Question | Expected chunk | Top retrieved chunk | Score | Rank of expected | Hit? |' + (llmAvailable ? ' Reply (truncated) |' : ''));
  lines.push('|---|---|---|---|---|---|---|' + (llmAvailable ? '---|' : ''));
  inDomainRows.forEach((r, i) => {
    const base = `| ${i + 1} | ${truncate(r.question, 70)} | ${r.expectedChunkIds.join(', ')} | ${r.topRetrievedId} - ${truncate(r.topRetrievedTitle, 30)} | ${r.topScore} | ${r.rankOfExpected ?? '-'} | ${r.hitAtK ? '✅' : '❌'} |`;
    lines.push(llmAvailable ? base + ` ${truncate(r.reply, 90)} |` : base);
  });
  lines.push('');
  lines.push('## 2. Out-of-scope test set (fallback correctness)');
  lines.push('');
  lines.push('Questions unrelated to disaster preparedness. Correct behaviour: retrieval finds nothing relevant, and the reply is the exact hard-coded out-of-scope refusal.');
  lines.push('');
  lines.push('| # | Question | Top retrieved chunk | Score | Suppressed? |' + (llmAvailable ? ' Exact fallback? | Reply (truncated) |' : ''));
  lines.push('|---|---|---|---|---|' + (llmAvailable ? '---|---|' : ''));
  outOfScopeRows.forEach((r, i) => {
    const base = `| ${i + 1} | ${truncate(r.question, 60)} | ${r.topRetrievedId} - ${truncate(r.topRetrievedTitle, 25)} | ${r.topScore} | ${r.correctlySuppressed ? '✅' : '❌'} |`;
    lines.push(llmAvailable ? base + ` ${r.exactFallbackMatch ? '✅' : '❌'} | ${truncate(r.reply, 80)} |` : base);
  });
  lines.push('');
  lines.push('## 3. In-scope-but-uncovered test set (corpus-gap disclosure)');
  lines.push('');
  lines.push('Questions that ARE about disaster preparedness but that no corpus passage answers. Correct behaviour: retrieval finds nothing relevant, and the reply says so WITHOUT using the hard out-of-scope refusal (that refusal is reserved for topic mismatch, not corpus gaps).');
  lines.push('');
  lines.push('| # | Question | Top retrieved chunk | Score | Suppressed? |' + (llmAvailable ? ' Avoided hard fallback? | Disclaimed gap? | Reply (truncated) |' : ''));
  lines.push('|---|---|---|---|---|' + (llmAvailable ? '---|---|---|' : ''));
  uncoveredRows.forEach((r, i) => {
    const base = `| ${i + 1} | ${truncate(r.question, 60)} | ${r.topRetrievedId} - ${truncate(r.topRetrievedTitle, 25)} | ${r.topScore} | ${r.correctlySuppressed ? '✅' : '❌'} |`;
    lines.push(llmAvailable ? base + ` ${r.avoidedHardFallback ? '✅' : '❌'} | ${r.disclaimedGap ? '✅' : '❌'} | ${truncate(r.reply, 70)} |` : base);
  });
  lines.push('');
  return lines.join('\n');
}
async function main() {
  const testSet = JSON.parse(fs.readFileSync(testSetPath, 'utf8'));
  const llmAvailable = Boolean(process.env.ANTHROPIC_API_KEY);
  console.log('CHATBOT RAG EVALUATION HARNESS');
  console.log(`Corpus-relevance threshold (MIN_RELEVANCE_SCORE): ${MIN_RELEVANCE_SCORE}  |  top-K: ${TOP_K}`);
  console.log(`LLM generation step: ${llmAvailable ? 'ENABLED' : 'DISABLED (no ANTHROPIC_API_KEY) - retrieval-only run'}`);
  const inDomainRows = await evaluateInDomain(testSet.inDomain, llmAvailable);
  const outOfScopeRows = await evaluateOutOfScope(testSet.outOfScope, llmAvailable);
  const uncoveredRows = await evaluateInScopeUncovered(testSet.inScopeUncovered, llmAvailable);
  const anyLlmErrors = [...inDomainRows, ...outOfScopeRows, ...uncoveredRows].some(r => r.llmError);
  const effectiveLlmAvailable = llmAvailable && !anyLlmErrors;
  if (llmAvailable && anyLlmErrors) {
    console.log(`\nWARNING: ANTHROPIC_API_KEY is set but every LLM call failed (e.g. "${[...inDomainRows, ...outOfScopeRows, ...uncoveredRows].find(r => r.llmError).llmError}"). Reporting retrieval-only results.`);
  }
  printConsoleTable('1. IN-DOMAIN (retrieval relevance)', ['#', 'question', 'expected', 'top retrieved', 'score', 'hit@' + TOP_K], [3, 45, 10, 25, 8, 8], inDomainRows.map((r, i) => [i + 1, truncate(r.question, 43), r.expectedChunkIds.join(','), truncate(`${r.topRetrievedId} ${r.topRetrievedTitle}`, 23), r.topScore, r.hitAtK ? 'YES' : 'NO']));
  printConsoleTable('2. OUT-OF-SCOPE (fallback correctness)', ['#', 'question', 'top retrieved', 'score', 'suppressed?'], [3, 45, 25, 8, 12], outOfScopeRows.map((r, i) => [i + 1, truncate(r.question, 43), truncate(`${r.topRetrievedId} ${r.topRetrievedTitle}`, 23), r.topScore, r.correctlySuppressed ? 'YES' : 'NO']));
  printConsoleTable('3. IN-SCOPE-BUT-UNCOVERED (corpus-gap disclosure)', ['#', 'question', 'top retrieved', 'score', 'suppressed?'], [3, 45, 25, 8, 12], uncoveredRows.map((r, i) => [i + 1, truncate(r.question, 43), truncate(`${r.topRetrievedId} ${r.topRetrievedTitle}`, 23), r.topScore, r.correctlySuppressed ? 'YES' : 'NO']));
  const summary = {
    hitAtK: pct(inDomainRows.filter(r => r.hitAtK).length, inDomainRows.length),
    hitAtTop1: pct(inDomainRows.filter(r => r.hitAtTop1).length, inDomainRows.length),
    avgTopScore: (inDomainRows.reduce((s, r) => s + r.topScore, 0) / inDomainRows.length).toFixed(4),
    oosSuppressed: pct(outOfScopeRows.filter(r => r.correctlySuppressed).length, outOfScopeRows.length),
    oosFallbackMatch: pct(outOfScopeRows.filter(r => r.exactFallbackMatch).length, outOfScopeRows.length),
    uncSuppressed: pct(uncoveredRows.filter(r => r.correctlySuppressed).length, uncoveredRows.length),
    uncAvoidedHardFallback: pct(uncoveredRows.filter(r => r.avoidedHardFallback).length, uncoveredRows.length),
    uncDisclaimedGap: pct(uncoveredRows.filter(r => r.disclaimedGap).length, uncoveredRows.length)
  };
  console.log('\n' + '='.repeat(90));
  console.log('SUMMARY');
  console.log('-'.repeat(90));
  console.log(`In-domain hit@${TOP_K}:        ${summary.hitAtK}`);
  console.log(`In-domain hit@rank-1:        ${summary.hitAtTop1}`);
  console.log(`In-domain avg top-1 score:   ${summary.avgTopScore}`);
  console.log(`Out-of-scope suppressed:     ${summary.oosSuppressed}`);
  if (effectiveLlmAvailable) console.log(`Out-of-scope exact fallback: ${summary.oosFallbackMatch}`);
  console.log(`Uncovered-in-scope suppressed: ${summary.uncSuppressed}`);
  if (effectiveLlmAvailable) {
    console.log(`Uncovered avoided hard fallback: ${summary.uncAvoidedHardFallback}`);
    console.log(`Uncovered disclaimed gap:        ${summary.uncDisclaimedGap}`);
  }
  fs.mkdirSync(resultsDir, {
    recursive: true
  });
  fs.writeFileSync(jsonOutPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    config: {
      topK: TOP_K,
      minRelevanceScore: MIN_RELEVANCE_SCORE
    },
    llmAvailable: effectiveLlmAvailable,
    summary,
    inDomain: inDomainRows,
    outOfScope: outOfScopeRows,
    inScopeUncovered: uncoveredRows
  }, null, 2));
  fs.writeFileSync(mdOutPath, buildMarkdown(inDomainRows, outOfScopeRows, uncoveredRows, effectiveLlmAvailable, summary));
  console.log(`\nWrote ${jsonOutPath}`);
  console.log(`Wrote ${mdOutPath}`);
}
main().catch(err => {
  console.error('Evaluation harness failed:', err);
  process.exit(1);
});
