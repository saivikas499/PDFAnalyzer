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

    // 1. Embed question
    console.log('1. Embedding question...')
    const questionEmbedding = await getQueryEmbedding(question)
    console.log(`Embedding size: ${questionEmbedding.length}`)

    // 2. Fetch chunks
    console.log('2. Searching for relevant chunks...')
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: questionEmbedding,
      doc_id: documentId,
      match_count: 4
    })

    if (error) {
      console.error("Supabase error:", error)
      return res.json({
        answer: "⚠ Error retrieving document context from database"
      })
    }

    console.log(`Found chunks: ${chunks?.length}`)

    if (!chunks || chunks.length === 0) {
      return res.json({
        answer: "⚠ No relevant content found in the document"
      })
    }

    // 3. Filter + rank + limit chunks (TOKEN SAFE)
      const relevantChunks = chunks.filter(c => c.similarity > 0.15)

      // Sort by highest similarity
      const sortedChunks = (relevantChunks.length > 0 ? relevantChunks : chunks)
        .sort((a, b) => b.similarity - a.similarity)

      // Take TOP 3 most relevant chunks only
      const finalChunks = sortedChunks
        .slice(0, 3)
        .map(c => c.content.slice(0, 500)) // limit size per chunk

      console.log(`Final chunks used: ${finalChunks.length}`)
    // 4. Ask AI
    console.log('3. Asking AI...')

    let answer = await askClaude(question, finalChunks)

    // ✅ If AI already returned meaningful error → keep it
    if (
      answer.toLowerCase().includes("rate limit") ||
      answer.toLowerCase().includes("token") ||
      answer.toLowerCase().includes("api key") ||
      answer.toLowerCase().includes("error")
    ) {
      console.warn("AI returned error message:", answer)
    }

    // ✅ Prevent empty response
    if (!answer || answer.trim() === "") {
      console.error("Empty AI response")
      answer = "⚠ AI could not generate a response"
    }

    console.log(`Answer: ${answer.substring(0, 100)}...`)
    console.log('--- Done ---\n')

    return res.json({ answer })

  } catch (err) {
    console.error('Chat route error:', err)

    let message = "⚠ Server error occurred"

    if (err.message?.toLowerCase().includes("fetch")) {
      message = "⚠ Network error while processing request"
    } else if (err.message) {
      message = `⚠ ${err.message}`
    }

    return res.status(500).json({ answer: message })
  }
})

export default router