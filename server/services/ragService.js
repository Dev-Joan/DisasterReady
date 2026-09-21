/**
 * ============================================================================
 *  RAG RETRIEVAL SERVICE
 * ============================================================================
 * Loads the vetted corpus and its precomputed embeddings, and answers the
 * core retrieval question: "which K chunks are most relevant to this user
 * question?" — via cosine similarity in embedding space, i.e. real vector
 * similarity search, not keyword matching.
 *
 * At this corpus size (tens of chunks) a brute-force scan over every
 * embedding is well under a millisecond and is easy to reason about and
 * inspect — there is no need for an ANN index (e.g. HNSW/FAISS), which
 * would only pay off at a much larger corpus size. If the corpus grew into
 * the thousands of chunks, `retrieveTopK` is the one function that would
 * need to swap its linear scan for an indexed lookup; nothing else in the
 * pipeline would need to change.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { embedText, cosineSimilarity } = require('./embeddingService');

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
      throw new Error(
        'corpusEmbeddings.json not found. Run `node scripts/buildCorpusEmbeddings.js` from the server directory first.'
      );
    }
    embeddingsCache = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
  }
  return embeddingsCache;
}

/**
 * Embeds `query` and ranks every corpus chunk by cosine similarity to it.
 * Returns the top `k` chunks, each annotated with its similarity score, so
 * the ranking itself — not just the final answer — can be inspected.
 *
 * @param {string} query - the user's raw question
 * @param {number} k - how many chunks to retrieve (default 4)
 * @returns {Promise<Array<{id, topic, title, text, score}>>}
 */
async function retrieveTopK(query, k = 4) {
  const corpus = loadCorpus();
  const { embeddings } = loadEmbeddings();

  const queryVector = await embedText(query);

  const scored = corpus.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryVector, embeddings[chunk.id])
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = { retrieveTopK, loadCorpus };
