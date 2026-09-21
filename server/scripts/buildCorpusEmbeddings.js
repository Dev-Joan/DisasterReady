/**
 * ============================================================================
 *  OFFLINE INDEX BUILD STEP
 * ============================================================================
 * Precomputes an embedding for every chunk in data/ragCorpus.json and writes
 * them to data/corpusEmbeddings.json. This is the "build the vector index"
 * step of a RAG pipeline, done once (or whenever the corpus changes) rather
 * than on every server start or every request — the corpus is small and
 * curated by hand, so re-embedding it is a deliberate, infrequent action,
 * not something that needs to happen live.
 *
 * Run with:
 *   node scripts/buildCorpusEmbeddings.js
 * from the `server` directory.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { embedText } = require('../services/embeddingService');

const corpusPath = path.join(__dirname, '../data/ragCorpus.json');
const outputPath = path.join(__dirname, '../data/corpusEmbeddings.json');

async function main() {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  console.log(`Embedding ${corpus.length} chunks from ragCorpus.json using Xenova/all-MiniLM-L6-v2...`);

  const embeddings = {};
  for (const chunk of corpus) {
    // Embed title + text together so the chunk's short heading contributes
    // to the meaning of the vector, not just the body text.
    const vector = await embedText(`${chunk.title}. ${chunk.text}`);
    embeddings[chunk.id] = vector;
    console.log(`  [${chunk.id}] ${chunk.title} -> ${vector.length}-dim vector`);
  }

  const output = {
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: Object.values(embeddings)[0]?.length || 0,
    builtAt: new Date().toISOString(),
    corpusVersion: corpus.length,
    embeddings
  };

  fs.writeFileSync(outputPath, JSON.stringify(output));
  console.log(`\nWrote ${Object.keys(embeddings).length} embeddings to ${outputPath}`);
}

main().catch((err) => {
  console.error('Failed to build corpus embeddings:', err);
  process.exit(1);
});
