require('dotenv').config({
  quiet: true
});
const Anthropic = require('@anthropic-ai/sdk');
const {
  retrieveTopK
} = require('./ragService');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
const OUT_OF_SCOPE_REPLY = "I'm scoped to disaster-preparedness questions. For anything else, please consult the appropriate professional or official source.";
const TOP_K = 4;
const MIN_RELEVANCE_SCORE = 0.35;
function buildSystemPrompt(retrievedChunks) {
  const context = retrievedChunks.length ? retrievedChunks.map((c, i) => `[Passage ${i + 1} - "${c.title}" (topic: ${c.topic})]\n${c.text}`).join('\n\n') : '(No sufficiently relevant passages were found in the corpus for this question.)';
  return `You are the DisasterReady preparedness assistant. You ONLY answer questions about disaster preparedness topics: earthquakes, floods, wildfires, severe weather, general emergency planning, evacuation, and emergency kits.

If a question is outside this scope entirely (e.g. medical advice, legal advice, general chit-chat, or anything unrelated to disaster preparedness), respond ONLY with:
"${OUT_OF_SCOPE_REPLY}"

For in-scope questions, you must answer using ONLY the passages retrieved below - this is your entire knowledge for this answer. Do not add facts, figures, or advice that are not supported by these passages, even if you believe you know the answer from general knowledge.

If the retrieved passages do not actually cover what was asked, say so plainly - for example: "The corpus I have doesn't cover that specific point." Do not guess or fill the gap with unsourced information.

Keep answers concise, practical, and safety-focused. For anything involving an active emergency, always recommend contacting official emergency services rather than relying solely on this chatbot.

--- RETRIEVED PASSAGES ---
${context}
--- END RETRIEVED PASSAGES ---`;
}
async function askChatbot(userMessage) {
  const retrieved = await retrieveTopK(userMessage, TOP_K);
  const groundingChunks = retrieved.filter(c => c.score >= MIN_RELEVANCE_SCORE);
  const systemPrompt = buildSystemPrompt(groundingChunks);
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: userMessage
    }]
  });
  return {
    reply: response.content[0].text,
    retrieval: retrieved.map(c => ({
      id: c.id,
      title: c.title,
      topic: c.topic,
      score: Number(c.score.toFixed(4)),
      usedForGrounding: c.score >= MIN_RELEVANCE_SCORE
    }))
  };
}
module.exports = {
  askChatbot,
  OUT_OF_SCOPE_REPLY,
  TOP_K,
  MIN_RELEVANCE_SCORE
};
