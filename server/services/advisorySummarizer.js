require('dotenv').config({
  quiet: true
});
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
const MODEL = 'claude-haiku-4-5-20251001';
const REWRITE_TIMEOUT_MS = 8000;
const CRITICAL_INSTRUCTIONS = {
  flood: {
    text: 'Avoid low-lying roads and move to higher ground if flooding threatens your area.',
    requiredConcepts: [['higher ground', 'high ground', 'higher floor', 'upstairs', 'elevated ground', 'higher place'], ['avoid', 'stay away', 'keep away', "don't go", 'do not go', 'steer clear', 'don’t drive', 'do not drive', "don't use", 'do not use']]
  },
  severe_weather: {
    text: 'Secure loose outdoor items and avoid unnecessary travel.',
    requiredConcepts: [['secure', 'tie down', 'bring inside', 'put away', 'weigh down'], ['outdoor', 'outside']]
  },
  heat: {
    text: 'Stay hydrated and avoid strenuous outdoor activity during peak heat.',
    requiredConcepts: [['hydrat', 'drink water', 'drink plenty', 'drink lots']]
  },
  wildfire: {
    text: 'Follow evacuation orders immediately if issued, and avoid the affected area.',
    requiredConcepts: [['evacuat', 'leave the area', 'leave immediately', 'get out', 'leave right away']]
  },
  earthquake: {
    text: 'Drop, cover, and hold on until shaking stops.',
    requiredConcepts: [['drop', 'get down', 'get low'], ['cover', 'shelter', 'hide under', 'protect your head', 'under a table', 'under sturdy']]
  }
};
function ensureActionableMessage(advisory) {
  const spec = CRITICAL_INSTRUCTIONS[advisory.hazard];
  if (advisory.source !== 'official' || !spec) return advisory.message;
  return `${advisory.message} ${spec.text}`;
}
const STYLE_INSTRUCTIONS = {
  child: 'Write for a young child (around ages 6-12). Use short, simple sentences and a warm, reassuring, calm tone. Avoid frightening or technical words. The specific safety action must still be stated plainly and simply (e.g. "go to higher ground", not "evacuate low-lying elevations").',
  teen: 'Write for a teenager. Be direct and straightforward - no softening, no fluff, no baby-talk. Treat them as capable of handling clear, factual information.',
  adult: 'Write for a general adult audience. Be concise and practical, professional in tone, with no unnecessary padding or repetition.',
  elderly: 'Write for an older adult. Use a calm, clear, respectful, reassuring tone with short plain sentences and no jargon. Do not sound alarmist, but keep the specific action explicit and unambiguous.'
};
function buildSystemPrompt(experienceMode) {
  const styleInstruction = STYLE_INSTRUCTIONS[experienceMode] || STYLE_INSTRUCTIONS.adult;
  return `You are rewriting a disaster-preparedness safety advisory so a specific audience can understand it more easily. You must follow these rules exactly:

1. You MUST preserve every safety-critical instruction from the original text - do not omit it, soften it into vagueness, or replace it with a different action.
2. You may ONLY simplify sentence structure, vocabulary, and tone. Do not add any new facts, numbers, locations, or instructions that are not already present in the original text.
3. Do not remove the sense of urgency or severity implied by the original.
4. Output ONLY the rewritten advisory text itself - no preamble, no quotation marks, no explanation.

Audience: ${styleInstruction}`;
}
async function fetchWithTimeout(promise, timeoutMs) {
  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Rewrite timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}
async function rewriteWithLLM(originalText, experienceMode) {
  const response = await fetchWithTimeout(anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: buildSystemPrompt(experienceMode),
    messages: [{
      role: 'user',
      content: originalText
    }]
  }), REWRITE_TIMEOUT_MS);
  const text = response.content?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Rewrite returned no usable text');
  }
  return text.trim();
}
function validateAdaptedText(hazard, adaptedText) {
  const spec = CRITICAL_INSTRUCTIONS[hazard];
  if (!spec) return true;
  if (!adaptedText || adaptedText.trim().length < 15) return false;
  const lower = adaptedText.toLowerCase();
  return spec.requiredConcepts.every(synonyms => synonyms.some(syn => lower.includes(syn)));
}
async function adaptAdvisoryForProfile(advisory, experienceMode) {
  const originalText = ensureActionableMessage(advisory);
  let rewritten;
  try {
    rewritten = await rewriteWithLLM(originalText, experienceMode);
  } catch (err) {
    return {
      originalText,
      adaptedText: originalText,
      wasAdapted: false,
      validationPassed: false,
      fallbackReason: `rewrite errored: ${err.message}`
    };
  }
  const validationPassed = validateAdaptedText(advisory.hazard, rewritten);
  if (!validationPassed) {
    return {
      originalText,
      adaptedText: originalText,
      wasAdapted: false,
      validationPassed: false,
      fallbackReason: 'rewrite dropped a required safety-critical instruction'
    };
  }
  return {
    originalText,
    adaptedText: rewritten,
    wasAdapted: true,
    validationPassed: true,
    fallbackReason: null
  };
}
module.exports = {
  adaptAdvisoryForProfile,
  validateAdaptedText,
  ensureActionableMessage,
  rewriteWithLLM,
  CRITICAL_INSTRUCTIONS,
  STYLE_INSTRUCTIONS,
  anthropic
};
