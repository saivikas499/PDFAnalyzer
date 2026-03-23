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

router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    const file = req.file
    const userId = req.headers['x-user-id']

    if (!file || !userId) {
      return res.status(400).json({ error: 'Missing file or user ID' })
    }

    console.log(`\n--- Upload started: ${file.originalname} ---`)

    // 1. Upload PDF to Supabase storage
    console.log('1. Uploading file to Supabase storage...')
    const storagePath = `${userId}/${Date.now()}_${file.originalname}`
    const { error: storageError } = await supabase.storage
      .from('pdfs')
      .upload(storagePath, file.buffer, { contentType: 'application/pdf' })

    if (storageError) throw storageError
    console.log('   Storage upload done.')

    // 2. Save document record to database
    console.log('2. Saving document record to database...')
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({ user_id: userId, file_name: file.originalname, storage_path: storagePath })
      .select()
      .single()

    if (docError) {
      console.error('   Document insert error:', docError)
      throw docError
    }
    console.log(`   Document saved. ID: ${doc.id}`)

    // 3. Extract text from PDF
    console.log('3. Extracting text from PDF...')
    const text = await extractText(file.buffer)
    console.log(`   Extracted ${text.length} characters.`)

    // 4. Split into chunks
    console.log('4. Splitting text into chunks...')
    const chunks = chunkText(text)
    console.log(`   Got ${chunks.length} chunks.`)

    if (chunks.length === 0) {
      throw new Error('No chunks were generated from this PDF.')
    }

    // 5. Embed each chunk and store
    console.log('5. Embedding chunks and saving to database...')
    console.log('   (First run may take 2-5 min to download the AI model)')

    for (let i = 0; i < chunks.length; i++) {
      console.log(`   Processing chunk ${i + 1} of ${chunks.length}...`)

      const embedding = await getEmbedding(chunks[i])
      console.log(`   Embedding size: ${embedding.length}`)
      console.log(`   Chunk preview: "${chunks[i].substring(0, 60)}..."`)

      const { data, error: chunkError } = await supabase
        .from('chunks')
        .insert({
          document_id: doc.id,
          content: chunks[i],
          embedding
        })
        .select()

      if (chunkError) {
        console.error(`   Chunk ${i + 1} insert error:`, chunkError)
        throw chunkError
      }

      console.log(`   Chunk ${i + 1} saved successfully. DB id: ${data?.[0]?.id}`)
    }

    console.log('6. All done!')
    console.log(`--- Upload complete: ${file.originalname} ---\n`)

    res.json({ success: true, documentId: doc.id, fileName: file.originalname })

  } catch (err) {
    console.error('\n--- Upload error ---')
    console.error('Message:', err.message)
    console.error('Details:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router