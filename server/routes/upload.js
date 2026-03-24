import express from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { extractText, chunkText } from '../services/pdfParser.js'
import { getEmbedding } from '../services/embeddings.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// SSE progress endpoint
router.get('/progress/:jobId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Store the response object so upload route can write to it
  global.progressClients = global.progressClients || {}
  global.progressClients[req.params.jobId] = res

  req.on('close', () => {
    delete global.progressClients[req.params.jobId]
  })
})

function sendProgress(jobId, data) {
  const client = global.progressClients?.[jobId]
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`)
  }
}

router.post('/', upload.single('pdf'), async (req, res) => {
  const file = req.file
  const userId = req.headers['x-user-id']
  const jobId = req.headers['x-job-id']

  if (!file || !userId) {
    return res.status(400).json({ error: 'Missing file or user ID' })
  }

  try {
    sendProgress(jobId, { step: 1, message: 'Uploading file to storage...', percent: 5 })
    const storagePath = `${userId}/${Date.now()}_${file.originalname}`
    const { error: storageError } = await supabase.storage
      .from('pdfs')
      .upload(storagePath, file.buffer, { contentType: 'application/pdf' })
    if (storageError) throw storageError

    sendProgress(jobId, { step: 2, message: 'Saving document record...', percent: 10 })
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({ user_id: userId, file_name: file.originalname, storage_path: storagePath })
      .select().single()
    if (docError) throw docError

    sendProgress(jobId, { step: 3, message: 'Extracting text from PDF...', percent: 20 })
    const text = await extractText(file.buffer)

    sendProgress(jobId, { step: 4, message: 'Splitting into chunks...', percent: 30 })
    const chunks = chunkText(text)

    sendProgress(jobId, { step: 5, message: `Processing ${chunks.length} chunks...`, percent: 35, total: chunks.length })

    // Batch embed chunks for speed
    const BATCH_SIZE = 5
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      const embeddings = await Promise.all(batch.map(chunk => getEmbedding(chunk)))
      const rows = batch.map((content, j) => ({
        document_id: doc.id,
        content,
        embedding: embeddings[j]
      }))
      const { error: chunkError } = await supabase.from('chunks').insert(rows)
      if (chunkError) throw chunkError

      const percent = 35 + Math.round(((i + batch.length) / chunks.length) * 60)
      sendProgress(jobId, {
        step: 5,
        message: `Processed ${Math.min(i + BATCH_SIZE, chunks.length)} of ${chunks.length} chunks...`,
        percent,
        current: Math.min(i + BATCH_SIZE, chunks.length),
        total: chunks.length
      })
    }

    sendProgress(jobId, { step: 6, message: 'Done!', percent: 100, documentId: doc.id, fileName: file.originalname })

    // Close SSE connection
    const client = global.progressClients?.[jobId]
    if (client) {
      client.write(`data: ${JSON.stringify({ done: true })}\n\n`)
      client.end()
    }

    res.json({ success: true, documentId: doc.id, fileName: file.originalname })
  } catch (err) {
    sendProgress(jobId, { error: err.message })
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router