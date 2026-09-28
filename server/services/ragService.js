const fs = require('fs');
const path = require('path');
const {
  embedText,
  cosineSimilarity
} = require('./embeddingService');
const corpusPath = path.join(__dirname, '../data/ragCorpus.json');
const embeddingsPath = path.join(__dirname, '../data/corpusEmbeddings.json');
let corpusCache = null;
let embeddingsCache = null;
function loadCorpus() {
  if (!corpusCache) {
    corpusCache = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  }
  return corpusCache;
}
function loadEmbeddings() {
  if (!embeddingsCache) {
    if (!fs.existsSync(embeddingsPath)) {
      throw new Error('corpusEmbeddings.json not found. Run `node scripts/buildCorpusEmbeddings.js` from the server directory first.');
    }
    embeddingsCache = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
  }
  return embeddingsCache;
}
async function retrieveTopK(query, k = 4) {
  const corpus = loadCorpus();
  const {
    embeddings
  } = loadEmbeddings();
  const queryVector = await embedText(query);
  const scored = corpus.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, embeddings[chunk.id])
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
module.exports = {
  retrieveTopK,
  loadCorpus
};
