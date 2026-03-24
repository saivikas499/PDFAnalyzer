import { pipeline } from '@xenova/transformers'

let embedder = null

const EMBEDDING_MODEL = 'Xenova/all-mpnet-base-v2' // stronger than MiniLM

async function getEmbedder() {
  if (!embedder) {
    console.log('   Loading embedding model... (only happens once)')
    embedder = await pipeline('feature-extraction', EMBEDDING_MODEL)
    console.log('   Embedding model loaded.')
  }
  return embedder
}

function averagePooling(data, dimensions) {
  // Ensure proper mean pooling across token dimension
  const result = new Array(dimensions).fill(0)
  const numTokens = data.length / dimensions
  for (let i = 0; i < data.length; i++) {
    result[i % dimensions] += data[i] / numTokens
  }
  return result
}

function normalize(vector) {
  // Normalize to unit length for better cosine similarity
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  return magnitude === 0 ? vector : vector.map(val => val / magnitude)
}

export async function getEmbedding(text) {
  const embed = await getEmbedder()

  // Clean the text before embedding
  const cleanedText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-'"]/g, '')
    .trim()
    .slice(0, 512) // model max token limit

  const output = await embed(cleanedText, { pooling: 'mean', normalize: true })
  const vector = Array.from(output.data)

  return vector
}

export async function getQueryEmbedding(question) {
  // For questions, prefix with context for better retrieval
  // This is a technique called "asymmetric semantic search"
  const prefixedQuestion = `Represent this question for searching relevant passages: ${question}`
  return getEmbedding(prefixedQuestion)
}