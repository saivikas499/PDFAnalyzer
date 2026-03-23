import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { getEmbedding } from '../services/embeddings.js'
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
    console.log(`Document ID: ${documentId}`)

    if (!question || !documentId) {
      return res.status(400).json({ error: 'Missing question or documentId' })
    }

    // 1. Embed the question
    console.log('1. Embedding the question...')
    const questionEmbedding = await getEmbedding(question)
    console.log(`   Embedding size: ${questionEmbedding.length}`)

    // 2. Find relevant chunks
    console.log('2. Searching for relevant chunks...')
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: questionEmbedding,
      doc_id: documentId,
      match_count: 4
    })

    if (error) {
      console.error('   match_chunks error:', error)
      throw error
    }

    console.log(`   Found ${chunks?.length} chunks`)
    if (chunks?.length > 0) {
      console.log(`   First chunk preview: ${chunks[0].content.substring(0, 100)}...`)
      console.log(`   Similarity scores: ${chunks.map(c => c.similarity.toFixed(3)).join(', ')}`)
    }

    if (!chunks || chunks.length === 0) {
      return res.json({ answer: 'No relevant content found in the document for this question.' })
    }

    const contextChunks = chunks.map(c => c.content)

    // 3. Ask the AI
    console.log('3. Asking AI...')
    const answer = await askClaude(question, contextChunks)
    console.log(`   Answer preview: ${answer.substring(0, 100)}...`)
    console.log('--- Chat done ---\n')

    res.json({ answer })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router