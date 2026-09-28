const fs = require('fs');
const path = require('path');
const {
  embedText
} = require('../services/embeddingService');
const corpusPath = path.join(__dirname, '../data/ragCorpus.json');
const outputPath = path.join(__dirname, '../data/corpusEmbeddings.json');
async function main() {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  console.log(`Embedding ${corpus.length} chunks from ragCorpus.json using Xenova/all-MiniLM-L6-v2...`);
  const embeddings = {};
  for (const chunk of corpus) {
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
main().catch(err => {
  console.error('Failed to build corpus embeddings:', err);
  process.exit(1);
});
