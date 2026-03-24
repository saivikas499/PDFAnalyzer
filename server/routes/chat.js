import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { getQueryEmbedding } from '../services/embeddings.js'
import { askClaude } from '../services/claude.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

router.post('/', async (req, res) => {
  try {
    const { question, documentId } = req.body

    console.log(`\n--- Chat request ---`)
    console.log(`Question: ${question}`)

    if (!question || !documentId) {
      return res.status(400).json({ error: 'Missing question or documentId' })
    }

    // 1. Embed the question with query-optimized embedding
    console.log('1. Embedding question...')
    const questionEmbedding = await getQueryEmbedding(question)
    console.log(`   Embedding size: ${questionEmbedding.length}`)

    // 2. Get chunks
    console.log('2. Searching for relevant chunks...')
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: questionEmbedding,
      doc_id: documentId,
      match_count: 8
    })

    if (error) throw error

    console.log(`   Found ${chunks?.length} chunks`)
    console.log(`   Scores: ${chunks?.map(c => c.similarity.toFixed(3)).join(', ')}`)

    if (!chunks || chunks.length === 0) {
      return res.json({ answer: 'No relevant content found in the document.' })
    }

    // 3. Filter by similarity threshold
    const relevantChunks = chunks.filter(c => c.similarity > 0.15)
    const finalChunks = relevantChunks.length > 0
      ? relevantChunks.map(c => c.content)
      : chunks.slice(0, 4).map(c => c.content)

    // 4. Ask AI
    console.log('3. Asking AI...')
    const answer = await askClaude(question, finalChunks)
    console.log(`   Answer: ${answer.substring(0, 100)}...`)
    console.log('--- Done ---\n')

    res.json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router