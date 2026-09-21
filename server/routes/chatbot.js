const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const { retrieveTopK } = require('../services/ragService');

router.post('/ask', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const { reply, retrieval } = await chatbotService.askChatbot(message);
    res.status(200).json({ reply, retrieval });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chatbot request failed' });
  }
});

// Retrieval-only debug/demo endpoint: runs just the embed + vector-search
// step with no LLM call, so the RAG retrieval step can be inspected and
// demonstrated in isolation (e.g. for an evaluation report) without
// spending LLM tokens or needing an API key at all.
router.get('/retrieve', async (req, res) => {
  const { q, k } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'q (query) is required' });
  }

  try {
    const topK = Math.min(Math.max(parseInt(k, 10) || 4, 1), 25);
    const results = await retrieveTopK(q, topK);
    res.status(200).json({ query: q, k: topK, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Retrieval failed' });
  }
});

module.exports = router;
