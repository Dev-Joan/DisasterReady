/**
 * ============================================================================
 *  EMBEDDING SERVICE
 * ============================================================================
 * Turns a piece of text into a fixed-length vector of numbers ("an embedding")
 * such that texts with similar meaning end up close together in that vector
 * space. This is the "R" (retrieval) half of the RAG pipeline's math.
 *
 * MODEL/LIBRARY CHOICE — and the tradeoffs of the alternatives:
 *
 *   Chosen: @xenova/transformers ("transformers.js") running
 *   `Xenova/all-MiniLM-L6-v2`, a real, pretrained sentence-transformer
 *   (384-dimensional output), executed locally in Node via ONNX Runtime.
 *
 *   Why this over a hosted embeddings API (OpenAI text-embedding-3-*,
 *   Voyage AI, etc.):
 *     + No extra API key/provider — the project already depends on the
 *       Anthropic API for generation; this doesn't add a second paid
 *       dependency just to embed a 23-chunk corpus.
 *     + Fully offline & deterministic after the one-time model download —
 *       embedding is a pure local computation, so retrieval can be
 *       demonstrated (and re-run, and marked) with no network call and no
 *       risk of an expired/missing API key breaking the demo.
 *     + Free and fast enough for this corpus size (tens of chunks, one
 *       query at a time) — cost/latency only matter at a scale this
 *       project doesn't operate at.
 *   Why NOT this in a larger production system:
 *     - Hosted models (e.g. OpenAI text-embedding-3-large, Voyage-3) are
 *       trained on far more data and produce noticeably better semantic
 *       separation, especially for longer or more technical passages.
 *     - 384 dimensions here vs. 1024–3072 for hosted models means less
 *       representational capacity — fine for a small, topic-clustered
 *       corpus like this one, more of a limitation at thousands of chunks
 *       covering overlapping topics.
 *     - Local inference is single-request CPU-bound in this process; a
 *       hosted API scales embedding throughput independently of the app
 *       server.
 *   If the corpus grew significantly or evaluation showed retrieval quality
 *   was the bottleneck, the only change needed is inside `embedText()` below
 *   — everything downstream (cosine similarity, ranking, prompt building)
 *   is agnostic to where the vector came from.
 * ============================================================================
 */

let extractorPromise = null;

// The pipeline (model weights + tokenizer) is expensive to load, so it's
// created once per process and reused for every embedding call.
async function getExtractor() {
  if (!extractorPromise) {
    // Dynamic import: @xenova/transformers ships as an ES module.
    extractorPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    );
  }
  return extractorPromise;
}

/**
 * Embeds a single string into a 384-dimensional unit vector.
 * `pooling: 'mean'` collapses the model's per-token vectors into one
 * sentence-level vector; `normalize: true` scales it to unit length so
 * that a plain dot product is equivalent to cosine similarity.
 */
async function embedText(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Cosine similarity between two equal-length vectors, in [-1, 1].
 * Because embedText() already L2-normalizes its output, this reduces to a
 * plain dot product — the division is kept explicit for correctness even
 * if a caller passes in a non-normalized vector from elsewhere.
 */
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { embedText, cosineSimilarity };
